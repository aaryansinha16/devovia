-- CreateEnum
CREATE TYPE "SuperchargedStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXECUTED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "supercharged_commands" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rawInput" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "slots" JSONB,
    "status" "SuperchargedStatus" NOT NULL DEFAULT 'PENDING',
    "actionType" TEXT,
    "actionPayload" JSONB,
    "result" JSONB,
    "errorMessage" TEXT,
    "llmPrompt" JSONB,
    "llmResponse" TEXT,
    "tokensUsed" INTEGER,
    "modelUsed" TEXT,
    "undoData" JSONB,
    "undoneAt" TIMESTAMP(3),
    "undoneById" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "supercharged_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supercharged_orchestrators" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerEvent" TEXT NOT NULL,
    "triggerConditions" JSONB,
    "actionIntent" TEXT NOT NULL,
    "actionSlots" JSONB NOT NULL,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "lastRunError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supercharged_orchestrators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supercharged_macros" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "trigger" TEXT,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supercharged_macros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supercharged_memories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supercharged_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supercharged_commands_userId_idx" ON "supercharged_commands"("userId");

-- CreateIndex
CREATE INDEX "supercharged_commands_intent_idx" ON "supercharged_commands"("intent");

-- CreateIndex
CREATE INDEX "supercharged_commands_status_idx" ON "supercharged_commands"("status");

-- CreateIndex
CREATE INDEX "supercharged_commands_createdAt_idx" ON "supercharged_commands"("createdAt");

-- CreateIndex
CREATE INDEX "supercharged_orchestrators_userId_idx" ON "supercharged_orchestrators"("userId");

-- CreateIndex
CREATE INDEX "supercharged_orchestrators_triggerEvent_idx" ON "supercharged_orchestrators"("triggerEvent");

-- CreateIndex
CREATE UNIQUE INDEX "supercharged_orchestrators_userId_name_key" ON "supercharged_orchestrators"("userId", "name");

-- CreateIndex
CREATE INDEX "supercharged_macros_userId_idx" ON "supercharged_macros"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "supercharged_macros_userId_name_key" ON "supercharged_macros"("userId", "name");

-- CreateIndex
CREATE INDEX "supercharged_memories_userId_idx" ON "supercharged_memories"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "supercharged_memories_userId_category_key_key" ON "supercharged_memories"("userId", "category", "key");

-- AddForeignKey
ALTER TABLE "supercharged_orchestrators" ADD CONSTRAINT "supercharged_orchestrators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supercharged_macros" ADD CONSTRAINT "supercharged_macros_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supercharged_memories" ADD CONSTRAINT "supercharged_memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
