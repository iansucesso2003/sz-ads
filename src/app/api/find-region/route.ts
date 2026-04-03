import { NextResponse } from "next/server";

export async function GET() {
  const regions = [
    "us-east-1", "us-west-1", "us-west-2", "us-east-2",
    "eu-west-1", "eu-west-2", "eu-central-1",
    "sa-east-1", "ap-southeast-1", "ap-northeast-1", "ap-south-1",
    "ca-central-1"
  ];

  const ref = "smoqdnecziflyheqplsj";
  const password = "jmqleI3rjzfxvOSt";
  const results: Record<string, string> = {};

  for (const region of regions) {
    const url = `postgresql://postgres.${ref}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    try {
      const { PrismaClient } = await import("@prisma/client");
      const p = new PrismaClient({ datasourceUrl: url });
      await p.$queryRaw`SELECT 1`;
      await p.$disconnect();
      results[region] = "OK";
      return NextResponse.json({ working_region: region, url });
    } catch (e: unknown) {
      results[region] = (e as Error).message?.split("\n")[0] ?? "error";
    }
  }

  return NextResponse.json({ error: "nenhuma região funcionou", results });
}
