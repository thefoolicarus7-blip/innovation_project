import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, UserRole } from "../types";

type LoginPayload = {
  email: string;
  password: string;
  role: UserRole;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  isAuthorized: (allowedRoles: UserRole[]) => boolean;
};

const AUTH_STORAGE_KEY = "swipe2work_portal_auth_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const value = useMemo<AuthContextValue>(() => ({
    user,
    async login(payload) {
      const { email, password, role } = payload;

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      if (role === "admin") {
        throw new Error("Admin login is RBAC-ready but not enabled yet. Use company role for now.");
      }

      const nextUser: AuthUser = {
        id: "company-1",
        name: "Acme Hiring Team",
        email,
        role: "company",
        token: "demo-company-token",
        companyId: "company-1",
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    },
    logout() {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    },
    isAuthorized(allowedRoles) {
      if (!user) {
        return false;
      }

      return allowedRoles.includes(user.role);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
