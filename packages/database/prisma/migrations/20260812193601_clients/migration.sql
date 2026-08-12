-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ClientJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceDate" DATETIME NOT NULL,
    "incomeTransactionId" TEXT NOT NULL,
    "isOutsourced" BOOLEAN NOT NULL DEFAULT false,
    "outsourcedTo" TEXT,
    "outsourcedTransactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "ClientJob_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientJob_incomeTransactionId_fkey" FOREIGN KEY ("incomeTransactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientJob_outsourcedTransactionId_fkey" FOREIGN KEY ("outsourcedTransactionId") REFERENCES "Transaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Client_deletedAt_idx" ON "Client"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientJob_incomeTransactionId_key" ON "ClientJob"("incomeTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientJob_outsourcedTransactionId_key" ON "ClientJob"("outsourcedTransactionId");

-- CreateIndex
CREATE INDEX "ClientJob_clientId_idx" ON "ClientJob"("clientId");

-- CreateIndex
CREATE INDEX "ClientJob_deletedAt_idx" ON "ClientJob"("deletedAt");
