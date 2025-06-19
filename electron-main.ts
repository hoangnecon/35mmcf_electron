// electron-main.ts
import { app, BrowserWindow, protocol, session, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const appRootPath = path.dirname(__filename); // dist/ (sau khi build)

let backendProcess: ReturnType<typeof fork> | null = null;
let mainWindow: BrowserWindow | null = null;
let dbPath: string; // Biến để lưu trữ đường dẫn database

// Hàm khởi tạo cửa sổ chính của Electron
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(appRootPath, 'preload.js'), // Đường dẫn đến preload script
      nodeIntegration: false, // Tắt nodeIntegration vì lý do bảo mật
      contextIsolation: true, // Bật contextIsolation
      webSecurity: process.env.NODE_ENV !== 'development', // Bật webSecurity trong production
      devTools: process.env.NODE_ENV === 'development',
    },
  });

  // Tải index.html từ Vite dev server trong development, hoặc từ tệp đã build trong production
  if (process.env.NODE_ENV === 'development') {
    // Chờ Vite dev server khởi động trước khi tải URL
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      console.error('Failed to load Vite dev server:', err);
      // Fallback hoặc thông báo lỗi cho người dùng
    });
  } else {
    // Tải tệp đã build từ thư mục `dist/public`
    mainWindow.loadFile(path.join(appRootPath, 'public', 'index.html')).catch(err => {
      console.error('Failed to load production HTML file:', err);
    });
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Xử lý các sự kiện của ứng dụng Electron
app.whenReady().then(async () => {
  // Xác định đường dẫn database và sao chép nếu cần (chỉ trong production)
  const userDataPath = app.getPath('userData');
  const dbFileName = 'drizzle.sqlite';
  dbPath = path.join(userDataPath, dbFileName);

  if (process.env.NODE_ENV === 'production') {
    // Đường dẫn đến database được đóng gói trong app.asar.unpacked (hoặc app.asar)
    // `extraFiles` trong electron-builder sẽ đặt nó trong thư mục gốc của app
    const bundledDbPath = path.join(process.resourcesPath, 'app', dbFileName);
    // Nếu database chưa tồn tại trong thư mục userData, sao chép từ gói ứng dụng
    if (!fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(bundledDbPath, dbPath);
        console.log(`[Electron Main] Database copied from ${bundledDbPath} to ${dbPath}`);
      } catch (error) {
        console.error(`[Electron Main] Failed to copy database: ${error.message}`);
        // Xử lý lỗi sao chép, có thể thoát ứng dụng hoặc thông báo
        app.quit();
        return;
      }
    }
  }

  // Khởi động backend Express server như một child process
  // Truyền đường dẫn database thông qua biến môi trường
  const backendEntry = path.join(appRootPath, 'server', 'index.cjs'); // THAY ĐỔI: trỏ đến .cjs
  backendProcess = fork(backendEntry, [], {
    stdio: 'inherit', // Chuyển tiếp output của backend ra console chính
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV,
      ELECTRON_DB_PATH: dbPath, // Truyền đường dẫn database cho backend
    },
  });

  backendProcess.on('exit', (code) => {
    console.log(`[Electron Main] Backend process exited with code ${code}`);
    if (code !== 0 && process.env.NODE_ENV === 'production') {
      // Có thể hiển thị thông báo lỗi cho người dùng nếu backend crash trong production
      if (mainWindow) {
        mainWindow.webContents.send('backend-error', 'Backend encountered an error and shut down.');
      }
    }
  });

  backendProcess.on('error', (err) => {
    console.error(`[Electron Main] Failed to start backend process: ${err.message}`);
    // Có thể hiển thị thông báo lỗi cho người dùng
  });

  // Tùy chỉnh Content Security Policy (CSP)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:*;`,
          `connect-src 'self' http://localhost:*;`, // Cho phép kết nối đến backend
          `img-src 'self' data: blob: https://*;` // Cho phép tải ảnh từ các nguồn an toàn (ví dụ: https)
        ],
      },
    });
  });

  createWindow();

  app.on('activate', () => {
    // Trên macOS, thường tạo lại cửa sổ trong ứng dụng khi nhấp vào biểu tượng dock
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Thoát ứng dụng khi tất cả các cửa sổ đã đóng, trừ trên macOS
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Kill backend process trước khi thoát Electron
  if (backendProcess) {
    console.log('[Electron Main] Killing backend process...');
    backendProcess.kill();
  }
});

// IPC handler để frontend yêu cầu đường dẫn database (nếu cần cho mục đích gỡ lỗi hoặc hiển thị)
ipcMain.handle('get-db-path', async () => {
  return dbPath;
});