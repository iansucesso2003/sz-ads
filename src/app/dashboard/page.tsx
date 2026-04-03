import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FolderKanban, Plus } from "lucide-react";

export default async function DashboardPage() {
  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) redirect("/organizacao");

  const adAccounts = await prisma.adAccount.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  if (adAccounts.length === 1) {
    redirect(`/dashboard/projeto/${adAccounts[0].id}`);
  }

  if (adAccounts.length > 1) {
    redirect(`/dashboard/projeto/${adAccounts[0].id}`);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <FolderKanban className="mb-4 h-16 w-16 text-white/30" />
      <h2 className="mb-2 text-xl font-medium text-white">
        Selecione um projeto
      </h2>
      <p className="mb-6 max-w-sm text-center text-white/50">
        Você ainda não tem projetos conectados. Adicione uma conta de anúncios
        Meta para começar.
      </p>
      <Link
        href="/dashboard/projeto/novo"
        className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/15"
      >
        <Plus className="h-4 w-4" />
        Adicionar projeto
      </Link>
    </div>
  );
}
