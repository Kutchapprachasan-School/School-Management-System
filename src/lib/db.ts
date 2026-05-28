import { initEnv } from "./env-init";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prismaInstance?: PrismaClient };

function getPrismaInstance(): PrismaClient {
  initEnv();
  if (!globalForPrisma.prismaInstance) {
    const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/schoolos?schema=public";
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prismaInstance = new PrismaClient({ adapter } as any);
  }
  return globalForPrisma.prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const instance = getPrismaInstance();
    const value = Reflect.get(instance, prop);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
});
