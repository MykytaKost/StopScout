import { StopRepository } from "../data/repositories/StopRepository";
import { FavoriteStopRepository } from "../data/repositories/FavoriteStopRepository";
import { UserRepository } from "../data/repositories/UserRepository";

import { SyncStops } from "../use-cases/SyncStops";
import { RegisterUser } from "../use-cases/RegisterUser";
import { LoginUser } from "../use-cases/LoginUser";

import { BcryptPasswordHasher } from "../infrastructure/security/BcryptPasswordHasher";

import { ExpoLocationService } from "../infrastructure/location/ExpoLocationService";

import { GetLiveDeparturesUseCase } from "../use-cases/GetLiveDeparturesUseCase";

// Repozytoria
const stopRepository = new StopRepository();
const favoriteStopRepository = new FavoriteStopRepository();
const userRepository = new UserRepository();
const locationService = new ExpoLocationService();

// Adapter bezpieczeństwa
const passwordHasher = new BcryptPasswordHasher();

// Kontener zależności
export const container = {
  stopRepository,
  favoriteStopRepository,
  userRepository,
  passwordHasher,
  locationService,

  syncStops: new SyncStops(stopRepository),
  registerUser: new RegisterUser(userRepository, passwordHasher),
  loginUser: new LoginUser(userRepository, passwordHasher),
  getLiveDepartures: new GetLiveDeparturesUseCase(),
};
