import { Departure } from "../domain/entities/Departure";
import { fetchDepartures } from "../infrastructure/api/ztmApi";

export class GetLiveDeparturesUseCase {
  constructor(
    private readonly fetchDeparturesFn: typeof fetchDepartures = fetchDepartures,
    private readonly nowProvider: () => Date = () => new Date(),
  ) {}

  async execute(stopId: number): Promise<Departure[]> {
    return this.fetchDeparturesFn(stopId, this.nowProvider());
  }
}