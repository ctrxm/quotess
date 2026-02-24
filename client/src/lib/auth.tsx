import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import type { PublicUser } from "@shared/schema";

interface AuthContextType {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { email: string; username: string; password: string; betaCode?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ user: PublicUser | null }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const user = data?.user || null;

  const login = async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Login gagal");
    await qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout", {});
    qc.setQueryData(["/api/auth/me"], { user: null });
    await qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  const register = async (data: { email: string; username: string; password: string; betaCode?: string }) => {
    const res = await apiRequest("POST", "/api/auth/register", data);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Registrasi gagal");
    await qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  return <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
