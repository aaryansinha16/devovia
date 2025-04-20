FROM node:18-alpine

# Set up working directory
WORKDIR /app

# Copy package.json and source code
COPY package.json ./
COPY src ./src
COPY tsconfig.json ./

# Create prisma directory and schema
RUN mkdir -p prisma
RUN echo '
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enum for user roles
enum Role {
  USER
  ADMIN
  MODERATOR
}

// Users and authentication
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  username      String    @unique
  password      String?
  bio           String?
  avatar        String?
  githubUrl     String?
  twitterUrl    String?
  portfolioUrl  String?
  role          Role      @default(USER)
  isVerified    Boolean   @default(false)
  
  // OAuth fields
  githubId      String?   @unique
  googleId      String?   @unique
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  sessions      Session[]   @relation("UserSessions")
  projects      Project[]  
  snippets      Snippet[]  
  posts         Post[]      @relation("UserPosts")
  comments      Comment[]   @relation("UserComments")
  likes         Like[]      @relation("UserLikes")
}

// User sessions for authentication and token management
model Session {
  id            String    @id @default(cuid())
  userId        String
  token         String    @unique // Refresh token
  device        String?   // Device information
  ipAddress     String?   // IP address
  userAgent     String?   // Browser/app info
  isValid       Boolean   @default(true) // For invalidating sessions
  isActive      Boolean   @default(true) // Backward compatibility
  lastActive    DateTime  @default(now())
  expiresAt     DateTime
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  user          User      @relation("UserSessions", fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
}

// Projects showcase
model Project {
  id            String    @id @default(cuid())
  title         String
  description   String
  repoUrl       String?
  demoUrl       String?
  thumbnail     String?
  techStack     String[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

// Code snippets
model Snippet {
  id            String    @id @default(cuid())
  title         String
  description   String?
  code          String
  language      String
  public        Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

// Posts / Articles
model Post {
  id            String    @id @default(cuid())
  title         String
  slug          String    @unique
  content       String
  excerpt       String?
  coverImage    String?
  published     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  publishedAt   DateTime?
  
  // Relations
  authorId      String
  author        User      @relation("UserPosts", fields: [authorId], references: [id], onDelete: Cascade)
  comments      Comment[] @relation("PostComments")
  likes         Like[]    @relation("PostLikes")
}

// Comments on posts
model Comment {
  id            String    @id @default(cuid())
  content       String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  authorId      String
  author        User      @relation("UserComments", fields: [authorId], references: [id], onDelete: Cascade)
  postId        String
  post          Post      @relation("PostComments", fields: [postId], references: [id], onDelete: Cascade)
}

// Likes on posts
model Like {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  
  // Relations
  userId        String
  user          User      @relation("UserLikes", fields: [userId], references: [id], onDelete: Cascade)
  postId        String
  post          Post      @relation("PostLikes", fields: [postId], references: [id], onDelete: Cascade)
  
  @@unique([userId, postId])
}
' > prisma/schema.prisma

# Update package.json to include Prisma client
RUN sed -i 's/"@repo\/database": "workspace:\*",/"@prisma\/client": "^5.10.0",/g' package.json

# Modify the prisma.ts file to use direct imports
RUN mkdir -p src/lib
RUN echo 'import { PrismaClient } from "@prisma/client";

// Define Role enum directly to match the schema
export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR"
}

// Export the type for use in type annotations
export type Role = Role;

// Type guard to check if a value is a valid Role
export function isRole(value: any): value is Role {
  return Object.values(Role).includes(value as Role);
}

// Helper function to convert string to Role enum
export function toRole(value: string): Role {
  if (isRole(value)) {
    return value as Role;
  }
  throw new Error(`Invalid role: ${value}`);
}

// Create a singleton Prisma client
const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;' > src/lib/prisma.ts

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3001

# Start the API
CMD ["node", "dist/index.js"]

