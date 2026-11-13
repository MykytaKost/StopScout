import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "stopscout.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS stops (
          stopId INTEGER PRIMARY KEY NOT NULL,
          stopName TEXT NOT NULL,
          stopLat REAL NOT NULL,
          stopLon REAL NOT NULL,
          notes TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS favorite_stops (
          stopId INTEGER PRIMARY KEY NOT NULL,
          FOREIGN KEY (stopId) REFERENCES stops(stopId) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          passwordHash TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      return db;
    })().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}
