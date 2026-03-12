-- CreateEnum
CREATE TYPE "PhysicalAssetType" AS ENUM ('HOUSE', 'LAND', 'GOLD', 'SILVER', 'CAR', 'BIKE', 'JEWELLERY', 'ELECTRONICS', 'ART', 'OTHER');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('HEALTH', 'TERM_LIFE', 'WHOLE_LIFE', 'CAR', 'BIKE', 'HOME', 'TRAVEL', 'OTHER');

-- CreateTable
CREATE TABLE "PhysicalAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PhysicalAssetType" NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "purchaseValue" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhysicalAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insurance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InsuranceType" NOT NULL,
    "provider" TEXT,
    "policyNumber" TEXT,
    "premium" DOUBLE PRECISION NOT NULL,
    "premiumInterval" TEXT NOT NULL DEFAULT 'yearly',
    "coverageAmount" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insurance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PhysicalAsset" ADD CONSTRAINT "PhysicalAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insurance" ADD CONSTRAINT "Insurance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
