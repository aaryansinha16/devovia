-- CreateEnum
CREATE TYPE "SessionRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "SessionVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "SessionLanguage" AS ENUM ('TYPESCRIPT', 'JAVASCRIPT', 'PYTHON', 'SQL', 'JSON', 'MARKDOWN', 'HTML', 'CSS', 'YAML');

-- CreateTable
CREATE TABLE "collaborative_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "visibility" "SessionVisibility" NOT NULL DEFAULT 'PRIVATE',
    "language" "SessionLanguage" NOT NULL DEFAULT 'TYPESCRIPT',
    "content" TEXT,
    "lockedBy" TEXT,
    "lockedUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "inviteCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaborative_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_permissions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SessionRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_snapshots" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "content" TEXT,
    "yjsState" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "note" TEXT,
    "size" INTEGER,

    CONSTRAINT "session_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collaborative_sessions_inviteCode_key" ON "collaborative_sessions"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "session_permissions_sessionId_userId_key" ON "session_permissions"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "collaborative_sessions" ADD CONSTRAINT "collaborative_sessions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_permissions" ADD CONSTRAINT "session_permissions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_permissions" ADD CONSTRAINT "session_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_snapshots" ADD CONSTRAINT "session_snapshots_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
