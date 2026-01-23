-- CreateTable
CREATE TABLE "inline_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceCardId" TEXT NOT NULL,
    "sourceSectionId" TEXT,
    "targetCardId" TEXT NOT NULL,
    "targetSectionId" TEXT,
    "highlightedText" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inline_references_sourceCardId_fkey" FOREIGN KEY ("sourceCardId") REFERENCES "knowledge_cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inline_references_sourceSectionId_fkey" FOREIGN KEY ("sourceSectionId") REFERENCES "knowledge_sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inline_references_targetCardId_fkey" FOREIGN KEY ("targetCardId") REFERENCES "knowledge_cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inline_references_targetSectionId_fkey" FOREIGN KEY ("targetSectionId") REFERENCES "knowledge_sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "inline_references_sourceCardId_idx" ON "inline_references"("sourceCardId");

-- CreateIndex
CREATE INDEX "inline_references_sourceSectionId_idx" ON "inline_references"("sourceSectionId");

-- CreateIndex
CREATE INDEX "inline_references_targetCardId_idx" ON "inline_references"("targetCardId");

-- CreateIndex
CREATE INDEX "inline_references_targetSectionId_idx" ON "inline_references"("targetSectionId");

-- CreateIndex
CREATE INDEX "inline_references_sourceCardId_targetCardId_idx" ON "inline_references"("sourceCardId", "targetCardId");
