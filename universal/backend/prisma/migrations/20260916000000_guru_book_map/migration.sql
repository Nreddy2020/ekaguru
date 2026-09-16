-- Additive only: whole-book knowledge map with chapters, terms and concept dependencies.
CREATE TABLE IF NOT EXISTS "GuruBookMap" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'book-map-v1',
    "title" TEXT NOT NULL,
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuruBookMap_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GuruBookMap_bookId_key" ON "GuruBookMap"("bookId");
CREATE INDEX IF NOT EXISTS "GuruBookMap_bookId_idx" ON "GuruBookMap"("bookId");
