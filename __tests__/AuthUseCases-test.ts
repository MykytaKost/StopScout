import { RegisterUser } from "../src/use-cases/RegisterUser";
import { LoginUser } from "../src/use-cases/LoginUser";
import { UserRepository } from "../src/data/repositories/UserRepository";
import { IPasswordHasher } from "../src/domain/ports/IPasswordHasher";

describe("Authentication Use Cases", () => {
  const userRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  } as unknown as UserRepository;

  const passwordHasher = {
    hash: jest.fn(),
    verify: jest.fn(),
  } as unknown as IPasswordHasher;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("RegisterUser", () => {
    const registerUser = new RegisterUser(userRepository, passwordHasher);

    it("should register a new user", async () => {
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);
      userRepository.create = jest.fn().mockResolvedValue(1);
      passwordHasher.hash = jest.fn().mockResolvedValue("hashed-password");

      const result = await registerUser.execute(
        "TEST@example.com",
        "password123",
      );

      expect(result).toBe(1);
      expect(passwordHasher.hash).toHaveBeenCalledWith("password123");
      expect(userRepository.create).toHaveBeenCalledWith(
        "test@example.com",
        "hashed-password",
      );
    });

    it("should reject an existing email", async () => {
      userRepository.findByEmail = jest.fn().mockResolvedValue({
        id: 1,
        email: "test@example.com",
        passwordHash: "existing-hash",
        createdAt: "2026-11-12",
      });

      await expect(
        registerUser.execute("test@example.com", "password123"),
      ).rejects.toThrow("User with this email already exists.");
    });

    it("should reject a password shorter than 8 characters", async () => {
      await expect(
        registerUser.execute("test@example.com", "1234567"),
      ).rejects.toThrow("Password must contain at least 8 characters.");
    });
  });

  describe("LoginUser", () => {
    const loginUser = new LoginUser(userRepository, passwordHasher);

    it("should authenticate a user with correct credentials", async () => {
      userRepository.findByEmail = jest.fn().mockResolvedValue({
        id: 1,
        email: "test@example.com",
        passwordHash: "hashed-password",
        createdAt: "2026-11-12",
      });

      passwordHasher.verify = jest.fn().mockResolvedValue(true);

      const result = await loginUser.execute("TEST@example.com", "password123");

      expect(result).toEqual({
        id: 1,
        email: "test@example.com",
        createdAt: "2026-11-12",
      });

      expect(passwordHasher.verify).toHaveBeenCalledWith(
        "password123",
        "hashed-password",
      );

      expect(result).not.toHaveProperty("passwordHash");
    });

    it("should reject an incorrect password", async () => {
      userRepository.findByEmail = jest.fn().mockResolvedValue({
        id: 1,
        email: "test@example.com",
        passwordHash: "hashed-password",
        createdAt: "2026-11-12",
      });

      passwordHasher.verify = jest.fn().mockResolvedValue(false);

      await expect(
        loginUser.execute("test@example.com", "wrong-password"),
      ).rejects.toThrow("Invalid email or password.");
    });
  });
});
