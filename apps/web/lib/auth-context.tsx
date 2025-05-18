"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  User,
  AuthTokens,
  getUserFromToken,
  getTokens,
  storeTokens,
  removeTokens,
  refreshTokens,
} from "./auth";

// eslint-disable-next-line no-unused-vars
type LoginFunction = (tokens: AuthTokens) => void;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: LoginFunction;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  sessionError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  // We don't expose tokens directly in the context value, but we need to track them internally

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedTokens = getTokens();

        if (storedTokens) {
          // Check if access token is expired
          const isTokenExpired = isAccessTokenExpired(storedTokens.accessToken);

          if (isTokenExpired) {
            // Try to refresh the tokens
            const success = await refreshSession();
            if (!success) {
              // If refresh failed, clear auth state
              setIsLoading(false);
            }
          } else {
            // Token is valid, set the user
            const user = getUserFromToken(storedTokens.accessToken);
            setUser(user);
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Check if access token is expired
  const isAccessTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiresAt;
    } catch (error) {
      console.error("Error parsing token:", error);
      return true; // Assume expired if there's an error
    }
  };

  // Function to refresh tokens
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      setSessionError(null);
      const storedTokens = getTokens();

      if (!storedTokens?.refreshToken) {
        logout();
        return false;
      }

      const result = await refreshTokens(storedTokens.refreshToken);

      if (result.success && result.tokens) {
        storeTokens(result.tokens);
        const user = getUserFromToken(result.tokens.accessToken);
        setUser(user);
        return true;
      } else {
        // If error contains SESSION_REVOKED code, set a specific message
        if (result.error?.includes("SESSION_REVOKED")) {
          setSessionError("Your session has been revoked from another device.");
        }
        logout();
        return false;
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      logout();
      return false;
    }
  }, []);

  // Login function
  const login = (tokens: AuthTokens) => {
    setSessionError(null);
    storeTokens(tokens);
    const user = getUserFromToken(tokens.accessToken);
    setUser(user);
  };

  // Logout function
  const logout = useCallback(() => {
    removeTokens();
    setUser(null);

    // Clear the OAuth callback processed flag from session storage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("oauth_callback_processed");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshSession,
        sessionError,
      }}
    >
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
