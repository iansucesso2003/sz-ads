import { NextResponse } from "next/server";

export async function GET() {
  const ref = "smoqdnecziflyheqplsj";
  const password = "jmqleI3rjzfxvOSt";
  const results: Record<string, string> = {};

  const urls = [
    { name: "direct-5432", url: `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres` },
    { name: "direct-6543", url: `postgresql://postgres:${password}@db.${ref}.supabase.co:6543/postgres` },
    { name: "pooler-sa-east-1-6543", url: `postgresql://postgres.${ref}:${password}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres` },
    { name: "pooler-us-east-1-6543", url: `postgresql://postgres.${ref}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres` },
    { name: "pooler-sa-east-1-5432", url: `postgresql://postgres.${ref}:${password}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres` },
  ];

  for (const { name, url } of urls) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const p = new PrismaClient({ datasourceUrl: url, log: [] });
      await Promise.race([
        p.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
      ]);
      await p.$disconnect();
      results[name] = "OK";
      return NextResponse.json({ working: name, url: url.replace(password, "***") });
    } catch (e: unknown) {
      results[name] = (e as Error).message?.split("\n").slice(0,2).join(" ") ?? "error";
    }
  }

  return NextResponse.json({ error: "nenhuma URL funcionou", results });
}
