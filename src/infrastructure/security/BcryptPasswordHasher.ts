import bcrypt from "bcryptjs";
import * as Crypto from "expo-crypto";
import { IPasswordHasher } from "../../domain/ports/IPasswordHasher";

// Używamy bezpiecznego generatora losowego z Expo Crypto.
bcrypt.setRandomFallback((length) =>
  Array.from(Crypto.getRandomBytes(length)),
);

export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    if (!password) {
      throw new Error("Password cannot be empty.");
    }

    return bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    if (!password || !hashedPassword) {
      return false;
    }

    return bcrypt.compare(password, hashedPassword);
  }
}
