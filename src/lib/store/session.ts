import { create } from "zustand";

interface SessionStore {
  sessionExpired: boolean;
  markExpired: () => void;
  clearExpired: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionExpired: false,
  markExpired: () => set({ sessionExpired: true }),
  clearExpired: () => set({ sessionExpired: false }),
}));
