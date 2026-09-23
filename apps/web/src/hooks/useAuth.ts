import { useSyncExternalStore, useEffect, useCallback } from "react";
import { authStore } from "@/store/auth";
import { api, clearTokens, restoreRefreshToken } from "@/lib/api";
import type { UserRole } from "@guild/types";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: UserRole; emailVerified: boolean };
}

export function useAuth() {
  const { user, isAuthenticated, isLoading } = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot
  );

  // On mount, attempt to restore session from stored refresh token
  useEffect(() => {
    const rt = restoreRefreshToken();
    if (!rt) {
      authStore.setLoading(false);
      return;
    }

    authStore.setLoading(true);
    api
      .post<{ accessToken: string; refreshToken: string }>("/auth/refresh", { refreshToken: rt })
      .then(async (tokens) => {
        // Fetch user info with the new token
        // The access token is now stored in the api module
        const me = await api.get<LoginResponse["user"]>("/auth/me");
        authStore.login(me, tokens.accessToken, tokens.refreshToken);
      })
      .catch(() => {
        clearTokens();
        authStore.setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string, turnstileToken: string) => {
    const data = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
      turnstileToken,
    });
    authStore.login(data.user, data.accessToken, data.refreshToken);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      authStore.logout();
    }
  }, []);

  return { user, isAuthenticated, isLoading, login, logout };
}
