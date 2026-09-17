/**
 * Auth store — lightweight reactive state without an external state library.
 * Uses a simple pub/sub pattern compatible with React's useSyncExternalStore.
 */

import type { UserRole } from "@forge/types";
import { setTokens, clearTokens, restoreRefreshToken } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type Listener = () => void;

let state: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((l) => l());
}

export const authStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): AuthState {
    return state;
  },

  login(user: AuthUser, accessToken: string, refreshToken: string): void {
    setTokens(accessToken, refreshToken);
    state = { user, isAuthenticated: true, isLoading: false };
    notify();
  },

  logout(): void {
    clearTokens();
    state = { user: null, isAuthenticated: false, isLoading: false };
    notify();
  },

  setLoading(loading: boolean): void {
    state = { ...state, isLoading: loading };
    notify();
  },

  initialize(): void {
    // If there's a refresh token in sessionStorage, mark as potentially authenticated.
    // The actual token refresh happens in the auth hook on mount.
    const rt = restoreRefreshToken();
    if (!rt) {
      state = { user: null, isAuthenticated: false, isLoading: false };
      notify();
    }
    // If RT exists, isLoading stays true until refresh attempt completes
  },
};

// Listen for session expiry events from the API client
window.addEventListener("forge:session-expired", () => {
  authStore.logout();
});
