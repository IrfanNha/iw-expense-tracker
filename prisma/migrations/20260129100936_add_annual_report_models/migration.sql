-- CreateTable
CREATE TABLE "MonthlySummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "income" INTEGER NOT NULL,
    "expense" INTEGER NOT NULL,
    "net" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyCategorySummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "TxType" NOT NULL,

    CONSTRAINT "MonthlyCategorySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "income" INTEGER NOT NULL,
    "expense" INTEGER NOT NULL,
    "net" INTEGER NOT NULL,
    "expenseRate" DOUBLE PRECISION NOT NULL,
    "savingRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnualSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlySummary_userId_year_idx" ON "MonthlySummary"("userId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySummary_userId_year_month_key" ON "MonthlySummary"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "MonthlyCategorySummary_userId_year_month_idx" ON "MonthlyCategorySummary"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyCategorySummary_userId_year_month_categoryId_key" ON "MonthlyCategorySummary"("userId", "year", "month", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualSummary_userId_year_key" ON "AnnualSummary"("userId", "year");

-- AddForeignKey
ALTER TABLE "MonthlySummary" ADD CONSTRAINT "MonthlySummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyCategorySummary" ADD CONSTRAINT "MonthlyCategorySummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyCategorySummary" ADD CONSTRAINT "MonthlyCategorySummary_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
