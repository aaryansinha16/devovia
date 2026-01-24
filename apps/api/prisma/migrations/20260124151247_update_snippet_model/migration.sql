/*
  Warnings:

  - You are about to drop the `_SnippetTags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_SnippetTags" DROP CONSTRAINT "_SnippetTags_A_fkey";

-- DropForeignKey
ALTER TABLE "_SnippetTags" DROP CONSTRAINT "_SnippetTags_B_fkey";

-- AlterTable
ALTER TABLE "Snippet" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[];

-- DropTable
DROP TABLE "_SnippetTags";

-- CreateIndex
CREATE INDEX "Snippet_userId_idx" ON "Snippet"("userId");

-- CreateIndex
CREATE INDEX "Snippet_language_idx" ON "Snippet"("language");

-- CreateIndex
CREATE INDEX "Snippet_isPublic_idx" ON "Snippet"("isPublic");
