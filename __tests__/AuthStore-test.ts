import { useAuthStore } from "../src/store/useAuthStore";
import { container } from "../src/di/container";

jest.mock("../src/di/container", () => ({
  container: {
    registerUser: {
      execute: jest.fn(),
    },
    loginUser: {
      execute: jest.fn(),
    },
  },
}));

describe("Auth Store", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useAuthStore.setState({
      user: null,
      isLoading: false,
      error: null,
    });
  });

  it("should register a user", async () => {
    (container.registerUser.execute as jest.Mock).mockResolvedValue(1);

    await useAuthStore.getState().register("test@example.com", "password123");

    expect(container.registerUser.execute).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
    );

    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("should login a user", async () => {
    const user = {
      id: 1,
      email: "test@example.com",
      createdAt: "2026-11-12",
    };

    (container.loginUser.execute as jest.Mock).mockResolvedValue(user);

    await useAuthStore.getState().login("test@example.com", "password123");

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("should handle login errors", async () => {
    (container.loginUser.execute as jest.Mock).mockRejectedValue(
      new Error("Invalid email or password."),
    );

    await expect(
      useAuthStore.getState().login("test@example.com", "wrong"),
    ).rejects.toThrow("Invalid email or password.");

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().error).toBe("Invalid email or password.");
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("should logout a user", () => {
    useAuthStore.setState({
      user: {
        id: 1,
        email: "test@example.com",
        createdAt: "2026-11-12",
      },
    });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
  });
});
