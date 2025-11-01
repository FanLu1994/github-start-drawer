-- CreateTable
CREATE TABLE "custom_tags" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "custom_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_tags_content_key" ON "custom_tags"("content");
