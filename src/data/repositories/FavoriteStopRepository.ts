import { getDatabase } from "../database/database";

export class FavoriteStopRepository {
  async getAll(userId: number): Promise<number[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{ stopId: number }>(
      "SELECT stopId FROM favorite_stops WHERE userId = ?",
      [userId],
    );

    return rows.map((row) => row.stopId);
  }

  async add(userId: number, stopId: number): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
      "INSERT OR IGNORE INTO favorite_stops (userId, stopId) VALUES (?, ?)",
      [userId, stopId],
    );
  }

  async remove(userId: number, stopId: number): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
      "DELETE FROM favorite_stops WHERE userId = ? AND stopId = ?",
      [userId, stopId],
    );
  }
}
