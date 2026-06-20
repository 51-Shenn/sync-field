import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { PrismaClient } from "@/generated/prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
	provider: "postgresql",
  }),
  socialProviders: {
	google: {
	  clientId: process.env.GOOGLE_CLIENT_ID as string,
	  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
	},
  },
});