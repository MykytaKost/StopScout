import * as Location from "expo-location";

import { ILocationService } from "../../domain/repositories/ILocationService";
import { Coordinates } from "../../domain/value-objects/Coordinates";

export class ExpoLocationService implements ILocationService {
  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();

    return status === "granted";
  }

  async getCurrentPosition(): Promise<Coordinates | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return new Coordinates(
        location.coords.latitude,
        location.coords.longitude,
        location.coords.accuracy,
      );
    } catch (error) {
      console.error("Nie udało się pobrać lokalizacji:", error);
      return null;
    }
  }
}
