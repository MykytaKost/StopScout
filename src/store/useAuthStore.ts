import { create } from "zustand";
import { container } from "../di/container";
import type { AuthenticatedUser } from "../use-cases/LoginUser";

interface AuthState {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  error: string | null;

  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  register: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      await container.registerUser.execute(email, password);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Registration failed.",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const user = await container.loginUser.execute(email, password);
      set({ user });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Login failed.",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => set({ user: null, error: null }),

  clearError: () => set({ error: null }),
}));
