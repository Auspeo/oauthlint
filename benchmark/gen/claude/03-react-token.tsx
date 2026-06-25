// auth.tsx
// React auth context + hook backed by a JWT from the backend `/login` endpoint.
//
// Features:
//   - login(email, password) -> POST /login, stores returned JWT
//   - token persisted in localStorage so the session survives page reloads
//   - logout() clears the token
//   - authFetch() wrapper that attaches `Authorization: Bearer <token>` to API calls
//   - exposes user, token, status, and error for UI consumption
//
// Usage:
//   <AuthProvider><App /></AuthProvider>
//   const { user, login, logout, authFetch, status } = useAuth();

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Base URL for the backend API. Override via Vite/CRA env, fall back to same-origin.
const API_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE_URL) ||
  "";

const TOKEN_STORAGE_KEY = "auth.jwt";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id?: string | number;
  email: string;
  name?: string;
  // Allow extra claims without fighting the type system.
  [key: string]: unknown;
}

export type AuthStatus = "idle" | "loading" | "authenticated" | "error";

interface LoginResponse {
  // Accept a few common field names so this drops into most backends.
  token?: string;
  accessToken?: string;
  access_token?: string;
  jwt?: string;
  user?: AuthUser;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** fetch() wrapper that injects the Authorization header and resolves API_BASE_URL. */
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

/** Decode the payload of a JWT without verifying the signature (client-side display only). */
function decodeJwt(token: string): Record<string, any> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    // base64url -> base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** True if the token has an `exp` claim that is already in the past. */
function isExpired(token: string): boolean {
  const claims = decodeJwt(token);
  if (!claims || typeof claims.exp !== "number") return false; // no exp => assume valid
  return claims.exp * 1000 <= Date.now();
}

/** Build an AuthUser from JWT claims as a fallback when the backend omits `user`. */
function userFromToken(token: string): AuthUser | null {
  const claims = decodeJwt(token);
  if (!claims) return null;
  const email = (claims.email as string) || (claims.sub as string) || "";
  if (!email) return null;
  return {
    id: claims.sub ?? claims.id,
    email,
    name: claims.name as string | undefined,
    ...claims,
  };
}

function readStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && !isExpired(token)) return token;
    if (token) localStorage.removeItem(TOKEN_STORAGE_KEY); // purge expired token
    return null;
  } catch {
    return null; // localStorage unavailable (SSR / privacy mode)
  }
}

function persistToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore storage failures */
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy init from storage so a reload restores the session synchronously.
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = readStoredToken();
    return t ? userFromToken(t) : null;
  });
  const [status, setStatus] = useState<AuthStatus>(() =>
    readStoredToken() ? "authenticated" : "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    persistToken(null);
    setToken(null);
    setUser(null);
    setError(null);
    setStatus("idle");
  }, []);

  // Keep storage in sync and react to logout/login happening in other tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== TOKEN_STORAGE_KEY) return;
      const next = readStoredToken();
      setToken(next);
      setUser(next ? userFromToken(next) : null);
      setStatus(next ? "authenticated" : "idle");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        // Try to surface a server-provided message.
        let message = `Login failed (${res.status})`;
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
          else if (body?.error) message = body.error;
        } catch {
          /* non-JSON error body */
        }
        throw new Error(message);
      }

      const data: LoginResponse = await res.json();
      const newToken =
        data.token || data.accessToken || data.access_token || data.jwt || null;

      if (!newToken) {
        throw new Error("Login response did not include a token.");
      }

      persistToken(newToken);
      setToken(newToken);
      setUser(data.user ?? userFromToken(newToken) ?? { email });
      setStatus("authenticated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected login error.";
      persistToken(null);
      setToken(null);
      setUser(null);
      setError(message);
      setStatus("error");
      throw err; // let callers handle/await failures too
    }
  }, []);

  // fetch() wrapper that attaches the bearer token and auto-logs-out on 401.
  const authFetch = useCallback(
    async (input: string, init: RequestInit = {}): Promise<Response> => {
      const url = input.startsWith("http") ? input : `${API_BASE_URL}${input}`;
      const headers = new Headers(init.headers || {});
      if (token) headers.set("Authorization", `Bearer ${token}`);
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const res = await fetch(url, { ...init, headers });

      // Token rejected by the server -> clear the session.
      if (res.status === 401) {
        logout();
      }
      return res;
    },
    [token, logout]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      status,
      error,
      isAuthenticated: !!token,
      login,
      logout,
      authFetch,
    }),
    [user, token, status, error, login, logout, authFetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return ctx;
}

export default AuthContext;
