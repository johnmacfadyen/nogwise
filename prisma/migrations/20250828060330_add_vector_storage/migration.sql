-- CreateTable
CREATE TABLE "MessageVector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WisdomVector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wisdomId" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageVector_messageId_key" ON "MessageVector"("messageId");

-- CreateIndex
CREATE INDEX "MessageVector_messageId_idx" ON "MessageVector"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "WisdomVector_wisdomId_key" ON "WisdomVector"("wisdomId");

-- CreateIndex
CREATE INDEX "WisdomVector_wisdomId_idx" ON "WisdomVector"("wisdomId");
