export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  name: string;
  createdAt: Date;
}

export interface AuthResponse {
  message: string;
  user: UserResponse;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
}
