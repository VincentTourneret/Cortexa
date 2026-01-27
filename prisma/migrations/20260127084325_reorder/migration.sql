-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_knowledge_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "userId" TEXT NOT NULL,
    "folderId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "knowledge_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "knowledge_cards_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_knowledge_cards" ("color", "createdAt", "folderId", "id", "summary", "title", "updatedAt", "userId") SELECT "color", "createdAt", "folderId", "id", "summary", "title", "updatedAt", "userId" FROM "knowledge_cards";
DROP TABLE "knowledge_cards";
ALTER TABLE "new_knowledge_cards" RENAME TO "knowledge_cards";
CREATE INDEX "knowledge_cards_userId_idx" ON "knowledge_cards"("userId");
CREATE INDEX "knowledge_cards_userId_createdAt_idx" ON "knowledge_cards"("userId", "createdAt");
CREATE INDEX "knowledge_cards_folderId_idx" ON "knowledge_cards"("folderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
