/*
  Warnings:

  - You are about to drop the column `tags` on the `repos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "repos" DROP COLUMN "tags",
ADD COLUMN     "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "repo_ai_tags" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "repo_ai_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "repo_ai_tags_repoId_tagId_key" ON "repo_ai_tags"("repoId", "tagId");

-- AddForeignKey
ALTER TABLE "repo_ai_tags" ADD CONSTRAINT "repo_ai_tags_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "repos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repo_ai_tags" ADD CONSTRAINT "repo_ai_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
