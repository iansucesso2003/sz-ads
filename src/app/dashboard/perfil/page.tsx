import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const orgId = (await cookies()).get("org-id")?.value;
  let organizationName: string | null = null;
  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    });
    organizationName = org?.name ?? null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { createdAt: true, password: true, image: true },
  });

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Perfil</h1>
          <p className="mt-1 text-sm text-white/50">
            Gerencie suas informações e preferências
          </p>
        </div>
        <ProfileForm
          name={session.user.name ?? null}
          email={session.user.email ?? null}
          image={user?.image ?? null}
          createdAt={user?.createdAt ?? null}
          organizationName={organizationName}
          hasPassword={!!user?.password}
        />
      </div>
    </div>
  );
}
