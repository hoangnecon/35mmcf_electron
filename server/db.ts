import { drizzle } from 'drizzle-orm/better-sqlite3';
    import Database from 'better-sqlite3';
    import * as schema from "@shared/schema";
    import path from "path";
    // Removed fileURLToPath from here as it's not strictly needed for this file's logic
    // unless you want to derive paths relative to THIS file's location which is less reliable
    // than receiving it as an env var from the Electron main process.

    let sqliteDbPath: string;

    // Ưu tiên sử dụng đường dẫn database được truyền từ Electron Main Process
    if (process.env.ELECTRON_DB_PATH) {
      sqliteDbPath = process.env.ELECTRON_DB_PATH;
      console.log(`[DB] Using Electron-provided DB Path: ${sqliteDbPath}`);
    } else if (process.env.NODE_ENV === 'production') {
      // Fallback cho production build nếu không có ELECTRON_DB_PATH
      // Đây là đường dẫn tương đối từ vị trí tệp index.js của server
      // (mà electron-builder sẽ đặt nó trong dist/server/) đến drizzle.sqlite
      // electron-builder đặt extraFiles ở cấp độ root của gói ứng dụng,
      // vì vậy path.resolve(process.cwd(), 'drizzle.sqlite') thường hoạt động
      // nếu cwd của backend process là root của app.
      // Tuy nhiên, để an toàn hơn, chúng ta nên dựa vào ELECTRON_DB_PATH
      // hoặc đặt database vào thư mục tài nguyên và sao chép.
      // Đối với trường hợp này, nếu ELECTRON_DB_PATH không được set (ví dụ: chạy Node server độc lập),
      // chúng ta sẽ cố gắng tìm nó ở thư mục hiện tại của process.
      sqliteDbPath = path.resolve(process.cwd(), 'drizzle.sqlite'); // This assumes server process's cwd is app root
      console.log(`[DB] Using inferred Production DB Path (fallback): ${sqliteDbPath}`);
    } else {
      // Môi trường phát triển (Node.js dev server)
      sqliteDbPath = path.resolve(process.cwd(), "drizzle.sqlite");
      console.log(`[DB] Using Development DB Path: ${sqliteDbPath}`);
    }

    // Khởi tạo better-sqlite3 database instance
    const sqlite = new Database(sqliteDbPath);

    // Khởi tạo Drizzle với better-sqlite3 client
    export const db = drizzle(sqlite, { schema });