import Database from "better-sqlite3";
import { app } from "electron";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as database from "../database";

let db: ReturnType<typeof drizzle<typeof database>> | undefined;

/**
 * Initializes the database by creating the necessary directories, 
 * setting up the SQLite database, and running migrations.
 */
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

/**
 * Retrieves the initialized database instance.
 * @returns {ReturnType<typeof drizzle<typeof database>>} The initialized database instance.
 * @throws {Error} Throws an error if the database has not been initialized.
 */
export function getDatabase() {
  if (!db) throw new Error("Database has not been initialized");
  return db;
}