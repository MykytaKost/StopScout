import { Coordinates } from "../../domain/value-objects/Coordinates";
import { GeoBoundingBox } from "../../domain/value-objects/GeoBoundingBox";
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

  async getInBoundingBox(box: GeoBoundingBox): Promise<Stop[]> {
    if (!box.shouldRenderMarkers()) {
      return [];
    }

    const db = await getDatabase();

    const rows = await db.getAllAsync<{
      stopId: number;
      stopName: string;
      stopLat: number;
      stopLon: number;
      notes: string;
    }>(
      `SELECT *
      FROM stops
      WHERE stopLat BETWEEN ? AND ?
        AND stopLon BETWEEN ? AND ?
      ORDER BY stopName`,
      box.minLat,
      box.maxLat,
      box.minLon,
      box.maxLon,
    );

    return rows.map(
      (row) =>
        new Stop(
          row.stopId,
          row.stopName,
          new Coordinates(row.stopLat, row.stopLon),
          row.notes,
        ),
    );
  }
}
