"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  AuthTokens,
  getUserFromToken,
  getTokens,
  storeTokens,
  removeTokens,
} from "./auth";

type LoginFunction = (tokens: AuthTokens) => void;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: LoginFunction;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // We don't expose tokens directly in the context value, but we need to track them internally

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedTokens = getTokens();

    if (storedTokens) {
      const user = getUserFromToken(storedTokens.accessToken);
      setUser(user);
      // setInternalTokens(storedTokens);
    }

    setIsLoading(false);
  }, []);

  // Login function
  const login = (tokens: AuthTokens) => {
    storeTokens(tokens);
    const user = getUserFromToken(tokens.accessToken);
    setUser(user);
    // setInternalTokens(tokens);
  };

  // Logout function
  const logout = () => {
    removeTokens();
    setUser(null);
    // setInternalTokens(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
