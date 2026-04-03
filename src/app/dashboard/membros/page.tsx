import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import MembrosClient from "./invite-form-client";

export default async function MembrosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) redirect("/organizacao");

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-400" />
        <h1 className="text-lg font-semibold text-white">Membros da organização</h1>
      </div>
      <MembrosClient orgId={orgId} currentUserId={session.user.id} />
    </div>
  );
}
