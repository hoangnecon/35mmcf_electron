// server/db.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from "path";

let sqliteDbPath: string;
sqliteDbPath = path.resolve(process.cwd(), "drizzle.sqlite");
console.log(`[DB] Using fixed DB Path (project root): ${sqliteDbPath}`);

// Khởi tạo better-sqlite3 database instance
const sqlite = new Database(sqliteDbPath);

// Khởi tạo Drizzle với better-sqlite3 client
export const db = drizzle(sqlite, { schema });