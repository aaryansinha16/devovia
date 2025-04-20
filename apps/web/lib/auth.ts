import { jwtDecode } from 'jwt-decode';
import { API_URL } from './config';

// Define the token types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Define the user interface
export interface User {
  id: string;
  email: string;
  name?: string;
  username: string;
  avatar?: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  isVerified: boolean;
}

// Define the JWT payload interface
interface JwtPayload {
  sub: string;
  role?: string;
  isVerified?: boolean;
  exp: number;
}

// Register a new user
export async function registerUser(userData: {
  email: string;
  username: string;
  password: string;
  name?: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

// Login with email/password
export async function loginUser(credentials: {
  email: string;
  password: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

// Get the current user from the token
export function getUserFromToken(token: string): User | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }
    
    return {
      id: decoded.sub,
      email: '', // JWT doesn't contain email, will need to fetch from API
      username: '', // JWT doesn't contain username, will need to fetch from API
      role: (decoded.role as 'USER' | 'ADMIN' | 'MODERATOR') || 'USER',
      isVerified: decoded.isVerified || false,
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Store tokens in localStorage
export function storeTokens(tokens: AuthTokens): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }
}

// Get tokens from localStorage
export function getTokens(): AuthTokens | null {
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
  }
  
  return null;
}

// Remove tokens from localStorage
export function removeTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// Logout user
export async function logoutUser(): Promise<void> {
  const tokens = getTokens();
  
  if (tokens) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
  
  removeTokens();
}

// GitHub OAuth login URL
export function getGitHubLoginUrl(): string {
  // Add a timestamp parameter to prevent caching issues
  const timestamp = Date.now();
  return `${API_URL}/auth/github?t=${timestamp}`;
}
