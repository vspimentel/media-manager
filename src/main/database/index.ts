import Database from "better-sqlite3";
import { app } from "electron";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as database from "../database";

let db: ReturnType<typeof drizzle<typeof database>> | undefined;

export function initializeDatabase(): void {
  const databaseDir = path.join(app.getPath("userData"), "database");
  fs.mkdirSync(databaseDir, { recursive: true });

  const sqlite = new Database(
    path.join(databaseDir, "media-manager.sqlite"),
  );

  sqlite.pragma("journal_mode = WAL");

  db = drizzle({ client: sqlite, schema: database });

  migrate(db, {
    migrationsFolder: path.join(__dirname, "../../../drizzle"),
  });
}

export function getDatabase() {
  if (!db) throw new Error("Database has not been initialized");
  return db;
}