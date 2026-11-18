import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "stopscout.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrateFavoriteStops(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(favorite_stops)",
  );

  // Jeśli kolumna userId już istnieje, migracja została wykonana.
  if (columns.some((column) => column.name === "userId")) {
    return;
  }

  const archive = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master
     WHERE type = 'table' AND name = 'favorite_stops_legacy'`,
  );

  if (archive.length > 0) {
    throw new Error("Migration stopped: favorite_stops_legacy already exists.");
  }

  await db.withTransactionAsync(async () => {
    // Zachowujemy dotychczasową wspólną listę.
    await db.execAsync(`
      ALTER TABLE favorite_stops
      RENAME TO favorite_stops_legacy;
    `);

    // Tworzymy nową tabelę z ulubionymi przypisanymi do kont.
    await db.execAsync(`
      CREATE TABLE favorite_stops (
        userId INTEGER NOT NULL,
        stopId INTEGER NOT NULL,
        PRIMARY KEY (userId, stopId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (stopId) REFERENCES stops(stopId) ON DELETE CASCADE
      );
    `);
  });
}

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
          notes TEXT NOT NULL DEFAULT '',
          type TEXT NOT NULL DEFAULT 'UNKNOWN'
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

      const stopColumns = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(stops)",
      );

      if (!stopColumns.some((column) => column.name === "type")) {
        await db.execAsync(`
          ALTER TABLE stops
          ADD COLUMN type TEXT NOT NULL DEFAULT 'UNKNOWN';
        `);
      }

      await migrateFavoriteStops(db);

      return db;
    })().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}
