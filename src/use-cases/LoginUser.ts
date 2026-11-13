import { IPasswordHasher } from "../domain/ports/IPasswordHasher";
import { UserRepository } from "../data/repositories/UserRepository";

export interface AuthenticatedUser {
  id: number;
  email: string;
  createdAt: string;
}

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(email: string, password: string): Promise<AuthenticatedUser> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      throw new Error("Invalid email or password.");
    }

    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const passwordMatches = await this.passwordHasher.verify(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new Error("Invalid email or password.");
    }

    // Nie zwracamy hasha poza warstwę logiki logowania.
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
