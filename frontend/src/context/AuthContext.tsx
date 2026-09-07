"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { me } from "@/lib/api";

interface AuthContextValue {
  token: string | null;
  username: string | null;
  isLoading: boolean;
  login(token: string, username: string): void;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  username: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_username");
    if (stored && storedUser) {
      // Validate token is still alive
      me(stored)
        .then(() => {
          setToken(stored);
          setUsername(storedUser);
        })
        .catch(() => {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_username");
        })
        .finally(() => setIsLoading(false));
    } else {
      setTimeout(() => setIsLoading(false), 0);
    }
  }, []);

  const login = useCallback((newToken: string, newUsername: string) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_username", newUsername);
    setToken(newToken);
    setUsername(newUsername);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_username");
    setToken(null);
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, username, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
