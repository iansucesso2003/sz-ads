import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) {
    redirect("/organizacao");
  }

  const adAccounts = await prisma.adAccount.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  const projects = adAccounts.map((a) => ({
    id: a.id,
    adAccountId: a.adAccountId,
    accountName: a.accountName,
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0B]">
      <AppSidebar projects={projects} />
      <main className="flex flex-1 min-h-0 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
