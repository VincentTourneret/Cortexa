-- CreateTable
CREATE TABLE "section_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "section_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "section_template_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionTemplateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'editorjs',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "section_template_items_sectionTemplateId_fkey" FOREIGN KEY ("sectionTemplateId") REFERENCES "section_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "section_templates_userId_idx" ON "section_templates"("userId");

-- CreateIndex
CREATE INDEX "section_template_items_sectionTemplateId_idx" ON "section_template_items"("sectionTemplateId");

-- CreateIndex
CREATE INDEX "section_template_items_sectionTemplateId_order_idx" ON "section_template_items"("sectionTemplateId", "order");
