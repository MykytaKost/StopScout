
import { getDatabase } from "../database/database";

export class FavoriteStopRepository {
  async getAll(): Promise<number[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{ stopId: number }>(
      "SELECT stopId FROM favorite_stops",
    );

    return rows.map((row) => row.stopId);
  }

  async add(stopId: number): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
      "INSERT OR IGNORE INTO favorite_stops (stopId) VALUES (?)",
      [stopId],
    );
  }

  async remove(stopId: number): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
      "DELETE FROM favorite_stops WHERE stopId = ?",
      [stopId],
    );
  }
}
