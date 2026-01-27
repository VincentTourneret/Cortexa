-- CreateTable
CREATE TABLE "card_shortcuts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folderId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "card_shortcuts_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "card_shortcuts_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "knowledge_cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "card_shortcuts_folderId_idx" ON "card_shortcuts"("folderId");

-- CreateIndex
CREATE INDEX "card_shortcuts_cardId_idx" ON "card_shortcuts"("cardId");

-- CreateIndex
CREATE INDEX "card_shortcuts_folderId_order_idx" ON "card_shortcuts"("folderId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "card_shortcuts_folderId_cardId_key" ON "card_shortcuts"("folderId", "cardId");
