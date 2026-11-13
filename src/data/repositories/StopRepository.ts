import { Stop } from "../../domain/entities/Stop";
import { getDatabase } from "../database/database";

export class StopRepository {
  async saveAll(stops: Stop[]): Promise<void> {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      for (const stop of stops) {
        await db.runAsync(
          `INSERT INTO stops
            (stopId, stopName, stopLat, stopLon, notes)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(stopId) DO UPDATE SET
             stopName = excluded.stopName,
             stopLat = excluded.stopLat,
             stopLon = excluded.stopLon,
             notes = excluded.notes`,
          [stop.stopId, stop.stopName, stop.stopLat, stop.stopLon, stop.notes],
        );
      }
    });
  }

  async getAll(): Promise<Stop[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{
      stopId: number;
      stopName: string;
      stopLat: number;
      stopLon: number;
      notes: string;
    }>("SELECT * FROM stops ORDER BY stopName ASC");

    return rows.map(
      (row) =>
        new Stop(row.stopId, row.stopName, row.stopLat, row.stopLon, row.notes),
    );
  }
}
