import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
declare global {
  var __db: PrismaClient | undefined;
}

// Need to do this because in dev mode with hot loading, we would create many instances of client
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
  prisma.$connect();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
    global.__db.$connect();
  }
  prisma = global.__db;
}

export { prisma };
