-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "theme" TEXT DEFAULT 'light',
    "emailVerified" TIMESTAMP(3),
    "verificationToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_cards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "userId" TEXT NOT NULL,
    "folderId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "order" INTEGER NOT NULL DEFAULT 0,
    "knowledgeCardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inline_references" (
    "id" TEXT NOT NULL,
    "sourceCardId" TEXT NOT NULL,
    "sourceSectionId" TEXT,
    "targetCardId" TEXT NOT NULL,
    "targetSectionId" TEXT,
    "highlightedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inline_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_template_items" (
    "id" TEXT NOT NULL,
    "sectionTemplateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'editorjs',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_shortcuts" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_shortcuts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_resources" (
    "id" TEXT NOT NULL,
    "folderId" TEXT,
    "cardId" TEXT,
    "sharedWithUserId" TEXT,
    "sharedWithGroupId" TEXT,
    "permissions" TEXT NOT NULL DEFAULT 'READ',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "groupId" TEXT,
    "senderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "permissions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "folders_userId_idx" ON "folders"("userId");

-- CreateIndex
CREATE INDEX "folders_parentId_idx" ON "folders"("parentId");

-- CreateIndex
CREATE INDEX "folders_userId_parentId_order_idx" ON "folders"("userId", "parentId", "order");

-- CreateIndex
CREATE INDEX "knowledge_cards_userId_idx" ON "knowledge_cards"("userId");

-- CreateIndex
CREATE INDEX "knowledge_cards_userId_createdAt_idx" ON "knowledge_cards"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "knowledge_cards_folderId_idx" ON "knowledge_cards"("folderId");

-- CreateIndex
CREATE INDEX "knowledge_sections_knowledgeCardId_idx" ON "knowledge_sections"("knowledgeCardId");

-- CreateIndex
CREATE INDEX "knowledge_sections_knowledgeCardId_order_idx" ON "knowledge_sections"("knowledgeCardId", "order");

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

-- CreateIndex
CREATE INDEX "section_templates_userId_idx" ON "section_templates"("userId");

-- CreateIndex
CREATE INDEX "section_template_items_sectionTemplateId_idx" ON "section_template_items"("sectionTemplateId");

-- CreateIndex
CREATE INDEX "section_template_items_sectionTemplateId_order_idx" ON "section_template_items"("sectionTemplateId", "order");

-- CreateIndex
CREATE INDEX "card_shortcuts_folderId_idx" ON "card_shortcuts"("folderId");

-- CreateIndex
CREATE INDEX "card_shortcuts_cardId_idx" ON "card_shortcuts"("cardId");

-- CreateIndex
CREATE INDEX "card_shortcuts_folderId_order_idx" ON "card_shortcuts"("folderId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "card_shortcuts_folderId_cardId_key" ON "card_shortcuts"("folderId", "cardId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "shared_resources_folderId_idx" ON "shared_resources"("folderId");

-- CreateIndex
CREATE INDEX "shared_resources_cardId_idx" ON "shared_resources"("cardId");

-- CreateIndex
CREATE INDEX "shared_resources_sharedWithUserId_idx" ON "shared_resources"("sharedWithUserId");

-- CreateIndex
CREATE INDEX "shared_resources_sharedWithGroupId_idx" ON "shared_resources"("sharedWithGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_cards" ADD CONSTRAINT "knowledge_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_cards" ADD CONSTRAINT "knowledge_cards_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sections" ADD CONSTRAINT "knowledge_sections_knowledgeCardId_fkey" FOREIGN KEY ("knowledgeCardId") REFERENCES "knowledge_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inline_references" ADD CONSTRAINT "inline_references_sourceCardId_fkey" FOREIGN KEY ("sourceCardId") REFERENCES "knowledge_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inline_references" ADD CONSTRAINT "inline_references_sourceSectionId_fkey" FOREIGN KEY ("sourceSectionId") REFERENCES "knowledge_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inline_references" ADD CONSTRAINT "inline_references_targetCardId_fkey" FOREIGN KEY ("targetCardId") REFERENCES "knowledge_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inline_references" ADD CONSTRAINT "inline_references_targetSectionId_fkey" FOREIGN KEY ("targetSectionId") REFERENCES "knowledge_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_templates" ADD CONSTRAINT "section_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_template_items" ADD CONSTRAINT "section_template_items_sectionTemplateId_fkey" FOREIGN KEY ("sectionTemplateId") REFERENCES "section_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_shortcuts" ADD CONSTRAINT "card_shortcuts_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_shortcuts" ADD CONSTRAINT "card_shortcuts_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "knowledge_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_resources" ADD CONSTRAINT "shared_resources_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_resources" ADD CONSTRAINT "shared_resources_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "knowledge_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_resources" ADD CONSTRAINT "shared_resources_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_resources" ADD CONSTRAINT "shared_resources_sharedWithGroupId_fkey" FOREIGN KEY ("sharedWithGroupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
