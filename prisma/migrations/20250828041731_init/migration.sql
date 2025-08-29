-- CreateTable
CREATE TABLE "Archive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "lastFetched" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "archiveId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_archiveId_fkey" FOREIGN KEY ("archiveId") REFERENCES "Archive" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wisdom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "prompt" TEXT,
    "messageIds" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WisdomVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wisdomId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "vote" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "_MessageToWisdom" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MessageToWisdom_A_fkey" FOREIGN KEY ("A") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MessageToWisdom_B_fkey" FOREIGN KEY ("B") REFERENCES "Wisdom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Archive_url_key" ON "Archive"("url");

-- CreateIndex
CREATE INDEX "Archive_url_idx" ON "Archive"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Message_messageId_key" ON "Message"("messageId");

-- CreateIndex
CREATE INDEX "Message_archiveId_idx" ON "Message"("archiveId");

-- CreateIndex
CREATE INDEX "Message_messageId_idx" ON "Message"("messageId");

-- CreateIndex
CREATE INDEX "Message_date_idx" ON "Message"("date");

-- CreateIndex
CREATE INDEX "Wisdom_votes_idx" ON "Wisdom"("votes");

-- CreateIndex
CREATE INDEX "Wisdom_featured_idx" ON "Wisdom"("featured");

-- CreateIndex
CREATE INDEX "Wisdom_createdAt_idx" ON "Wisdom"("createdAt");

-- CreateIndex
CREATE INDEX "WisdomVote_wisdomId_idx" ON "WisdomVote"("wisdomId");

-- CreateIndex
CREATE INDEX "WisdomVote_sessionId_idx" ON "WisdomVote"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WisdomVote_wisdomId_sessionId_key" ON "WisdomVote"("wisdomId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "_MessageToWisdom_AB_unique" ON "_MessageToWisdom"("A", "B");

-- CreateIndex
CREATE INDEX "_MessageToWisdom_B_index" ON "_MessageToWisdom"("B");
