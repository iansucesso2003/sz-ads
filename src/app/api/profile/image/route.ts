import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Envie a imagem como multipart/form-data" },
      { status: 400 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhuma imagem enviada" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Use JPEG, PNG ou WebP" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: dataUrl },
    });

    return NextResponse.json({ image: dataUrl });
  } catch (e) {
    console.error("[profile image]", e);
    return NextResponse.json(
      { error: "Erro ao atualizar foto" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[profile image delete]", e);
    return NextResponse.json(
      { error: "Erro ao remover foto" },
      { status: 500 }
    );
  }
}
