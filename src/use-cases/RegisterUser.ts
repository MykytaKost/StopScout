import { IPasswordHasher } from "../domain/ports/IPasswordHasher";
import { UserRepository } from "../data/repositories/UserRepository";

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(email: string, password: string): Promise<number> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new Error("Invalid email address.");
    }

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    const passwordHash = await this.passwordHasher.hash(password);

    return this.userRepository.create(normalizedEmail, passwordHash);
  }
}
