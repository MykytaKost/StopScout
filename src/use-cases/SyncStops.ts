import { Stop } from "../domain/entities/Stop";
import { fetchStops } from "../infrastructure/api/stopsApi";
import { StopRepository } from "../data/repositories/StopRepository";

export class SyncStops {
  constructor(
    private readonly stopRepository: StopRepository,
    private readonly fetchStopsFn: typeof fetchStops = fetchStops,
  ) {}

  async execute(): Promise<Stop[]> {
    // Pobranie aktualnych przystanków z API ZTM
    const stops = await this.fetchStopsFn();

    // Zapis pobranych danych do lokalnej bazy SQLite
    await this.stopRepository.saveAll(stops);

    return stops;
  }
}
