import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const memberships = await prisma.userOrganization.findMany({
    where: { userId: session.user.id },
    include: {
      organization: true,
    },
  });

  return NextResponse.json(
    memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = body.name as string;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Nome é obrigatório" },
      { status: 400 }
    );
  }

  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const existing = await prisma.organization.findUnique({
    where: { slug },
  });

  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

  const org = await prisma.organization.create({
    data: {
      name: name.trim(),
      slug: finalSlug,
      members: {
        create: {
          userId: session.user.id,
          role: "owner",
        },
      },
    },
  });

  return NextResponse.json(org);
}
