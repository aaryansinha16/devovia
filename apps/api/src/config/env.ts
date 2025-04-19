import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT || '4000',
  jwt: {
    secret: process.env.JWT_SECRET || 'ALPHA_SECRET_101',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'RALPHA_SECRET_101',
    expiresIn: process.env.JWT_EXPIRATION || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
  },
};
