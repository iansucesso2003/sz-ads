import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region") ?? "us-east-1";
  const ref = "smoqdnecziflyheqplsj";
  const password = "jmqleI3rjzfxvOSt";

  const urls = [
    { name: "direct", url: `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres` },
    { name: `pooler-${region}`, url: `postgresql://postgres.${ref}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres` },
  ];

  const results: Record<string, string> = {};

  for (const { name, url } of urls) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const p = new PrismaClient({ datasourceUrl: url });
      await p.$queryRaw`SELECT 1`;
      await p.$disconnect();
      results[name] = "OK ✓";
    } catch (e: unknown) {
      results[name] = String((e as Error).message).split("\n").filter(Boolean)[0] ?? "error";
    }
  }

  return NextResponse.json({ results });
}
