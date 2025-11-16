import { PrismaClient } from "@/generated/prisma/client";
import path from "path";

declare global {
  // prevent multiple instances in dev
  var prisma: PrismaClient | undefined;
}

// Ensure DATABASE_URL is set correctly and resolve to absolute path
const getDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
  
  // If it's a relative path, resolve it to absolute
  if (databaseUrl.startsWith("file:./") || databaseUrl.startsWith("file:../")) {
    const relativePath = databaseUrl.replace(/^file:/, "");
    const absolutePath = path.resolve(process.cwd(), relativePath);
    // Use forward slashes for SQLite file URLs (works on Windows too)
    return `file:${absolutePath.replace(/\\/g, "/")}`;
  }
  
  return databaseUrl;
};

const databaseUrl = getDatabaseUrl();

export const prisma = global.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

