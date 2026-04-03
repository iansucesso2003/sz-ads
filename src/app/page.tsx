import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) {
    redirect("/organizacao");
  }
  redirect("/dashboard");
}
