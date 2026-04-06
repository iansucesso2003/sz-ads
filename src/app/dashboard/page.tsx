import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FolderKanban, Plus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) redirect("/organizacao");

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  if (projects.length >= 1) redirect(`/dashboard/projeto/${projects[0].id}`);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <FolderKanban className="mb-4 h-16 w-16 text-white/30" />
      <h2 className="mb-2 text-xl font-medium text-white">Nenhum projeto ainda</h2>
      <p className="mb-6 max-w-sm text-center text-white/50">
        Crie seu primeiro projeto e conecte Meta Ads, Google Ads ou os dois.
      </p>
      <Link href="/dashboard/projeto/novo" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500 transition-colors">
        <Plus className="h-4 w-4" />
        Criar projeto
      </Link>
    </div>
  );
}
