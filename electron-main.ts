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
let dbPath: string; // Đường dẫn đến database trong thư mục userData

// Hàm khởi tạo cửa sổ chính của Electron
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(appRootPath, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: process.env.NODE_ENV === 'development', // Đặt lại cho production
      additionalArguments: [
        '--is-electron-build',
        process.env.NODE_ENV === 'production' ? '--is-production-env' : '--is-development-env',
      ],
    },
    autoHideMenuBar: true,
  });

  // ĐÃ SỬA: Tải index.html dựa trên việc ứng dụng có được đóng gói hay không
  if (process.env.NODE_ENV === 'development') {
    // Development mode (Vite dev server)
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      console.error('Failed to load Vite dev server:', err);
    });
  } else {
    // Production mode (either unpacked dist or packed .exe)
    let pathToIndexHtml: string;
    if (app.isPackaged) {
      // Chạy từ bản .exe đã đóng gói (index.html nằm trong thư mục resources/)
      pathToIndexHtml = path.join(process.resourcesPath, 'index.html');
      console.log(`[Electron Main] Loading packaged index.html from: ${pathToIndexHtml}`);
    } else {
      // Chạy "npm run electron-start-prod" (từ thư mục dist/ chưa đóng gói)
      // index.html nằm ngay trong thư mục dist/ (app.getAppPath() trỏ đến dist/)
      pathToIndexHtml = path.join(app.getAppPath(), 'index.html');
      console.log(`[Electron Main] Loading unpacked index.html from: ${pathToIndexHtml}`);
    }
    
    mainWindow.loadFile(pathToIndexHtml).catch(err => {
      console.error('Failed to load production HTML file:', err);
    });
  }

  // Luôn mở devtools khi debug bản build
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error(`[Electron Renderer] Failed to load URL: ${validatedURL}`);
    console.error(`Error Code: ${errorCode}, Description: ${errorDescription}, Is Main Frame: ${isMainFrame}`);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.error(`[Electron Renderer] Render process gone. Reason: ${details.reason}, Exit Code: ${details.exitCode}`);
      if (details.reason === 'crashed') {
          console.error('[Electron Renderer] The renderer process crashed unexpectedly!');
      }
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.warn('[Electron Renderer] The renderer process has become unresponsive.');
  });

  mainWindow.webContents.on('responsive', () => {
    console.log('[Electron Renderer] The renderer process is responsive again.');
  });
}

app.whenReady().then(async () => {
  process.on('uncaughtException', (error) => {
    console.error('[Electron Main Process] Uncaught Exception:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(`alert('An unexpected error occurred in the main process: ${error.message}. Check console for details.');`)
        .catch(jsError => console.error('Failed to execute JS alert in renderer:', jsError));
    }
  });

  const userDataPath = app.getPath('userData');
  const dbFileName = 'drizzle.sqlite';
  dbPath = path.join(userDataPath, dbFileName);

  if (process.env.NODE_ENV === 'production') {
    // Sử dụng process.resourcesPath để tìm file database bên ngoài ASAR
    const bundledDbPath = path.join(process.resourcesPath, dbFileName);
    if (!fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(bundledDbPath, dbPath);
        console.log(`[Electron Main] Database copied from ${bundledDbPath} to ${dbPath}`);
      } catch (error: any) {
        console.error(`[Electron Main] Failed to copy database: ${error.message}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.executeJavaScript(`alert('Failed to initialize database: ${error.message}. Application will exit.');`)
                .finally(() => app.quit());
        } else {
            app.quit();
        }
        return;
      }
    }
  }

  const backendEntry = path.join(appRootPath, 'server', 'index.cjs');
  backendProcess = fork(backendEntry, [], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV,
      ELECTRON_DB_PATH: dbPath,
      IS_ELECTRON_BUILD: 'true',
    },
  });

  backendProcess.on('exit', (code) => {
    console.log(`[Electron Main] Backend process exited with code ${code}`);
    if (code !== 0 && process.env.NODE_ENV === 'production') {
      if (mainWindow) {
        mainWindow.webContents.send('backend-error', 'Backend encountered an error and shut down.');
      }
    }
  });

  backendProcess.on('error', (err) => {
    console.error(`[Electron Main] Failed to start backend process: ${err.message}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`alert('Failed to start backend: ${err.message}. Please restart the application.');`);
    }
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* file:;`,
          `connect-src 'self' http://localhost:* ws://localhost:*;`,
          `img-src 'self' data: blob: https:*;`
        ],
      },
    });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    console.log('[Electron Main] Killing backend process...');
    backendProcess.kill();
  }
});