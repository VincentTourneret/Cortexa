-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_knowledge_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "order" INTEGER NOT NULL DEFAULT 0,
    "knowledgeCardId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "knowledge_sections_knowledgeCardId_fkey" FOREIGN KEY ("knowledgeCardId") REFERENCES "knowledge_cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_knowledge_sections" ("content", "createdAt", "id", "knowledgeCardId", "order", "title", "updatedAt") SELECT "content", "createdAt", "id", "knowledgeCardId", "order", "title", "updatedAt" FROM "knowledge_sections";
DROP TABLE "knowledge_sections";
ALTER TABLE "new_knowledge_sections" RENAME TO "knowledge_sections";
CREATE INDEX "knowledge_sections_knowledgeCardId_idx" ON "knowledge_sections"("knowledgeCardId");
CREATE INDEX "knowledge_sections_knowledgeCardId_order_idx" ON "knowledge_sections"("knowledgeCardId", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
