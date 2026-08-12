/*
  Warnings:

  - Added the required column `invoiceMonth` to the `CardPurchase` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CardInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CardPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "categoryId" TEXT NOT NULL,
    "establishment" TEXT NOT NULL,
    "note" TEXT,
    "date" DATETIME NOT NULL,
    "invoiceMonth" TEXT NOT NULL,
    "installmentGroupId" TEXT,
    "installmentNumber" INTEGER,
    "installmentTotal" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "CardPurchase_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CreditCard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CardPurchase_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CardPurchase" ("cardId", "categoryId", "createdAt", "date", "deletedAt", "establishment", "id", "installmentGroupId", "installmentNumber", "installmentTotal", "note", "value") SELECT "cardId", "categoryId", "createdAt", "date", "deletedAt", "establishment", "id", "installmentGroupId", "installmentNumber", "installmentTotal", "note", "value" FROM "CardPurchase";
DROP TABLE "CardPurchase";
ALTER TABLE "new_CardPurchase" RENAME TO "CardPurchase";
CREATE INDEX "CardPurchase_cardId_idx" ON "CardPurchase"("cardId");
CREATE INDEX "CardPurchase_invoiceMonth_idx" ON "CardPurchase"("invoiceMonth");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CardInvoice_cardId_month_key" ON "CardInvoice"("cardId", "month");
