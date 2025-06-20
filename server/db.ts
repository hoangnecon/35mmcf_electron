// server/db.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from "path";

let sqliteDbPath: string;
if (process.env.ELECTRON_DB_PATH) {
  // Nếu biến môi trường ELECTRON_DB_PATH tồn tại (khi chạy trong Electron đã đóng gói)
  sqliteDbPath = process.env.ELECTRON_DB_PATH;
  console.log(`[DB] Using ELECTRON_DB_PATH: ${sqliteDbPath}`);
} else {
  // Đây là trường hợp fallback:
  // - Khi chạy 'npm run start' (Node.js thuần)
  // - Khi chạy 'npm run electron-dev' (backend vẫn là Node.js thuần trong dev)
  // - Khi chạy lệnh drizzle-kit push/seed
  sqliteDbPath = path.resolve(process.cwd(), "drizzle.sqlite");
  console.log(`[DB] Using default DB Path (process.cwd()): ${sqliteDbPath}`);
}

// Khởi tạo better-sqlite3 database instance
const sqlite = new Database(sqliteDbPath);

// Khởi tạo Drizzle với better-sqlite3 client
export const db = drizzle(sqlite, { schema });