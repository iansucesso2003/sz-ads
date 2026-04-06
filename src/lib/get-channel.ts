import { prisma } from "@/lib/prisma";

export async function getMetaChannel(projectId: string, orgId: string) {
  return prisma.channel.findFirst({
    where: {
      projectId,
      platform: "META",
      project: { organizationId: orgId },
    },
  });
}

export async function getGoogleChannel(projectId: string, orgId: string) {
  return prisma.channel.findFirst({
    where: {
      projectId,
      platform: "GOOGLE",
      project: { organizationId: orgId },
    },
  });
}
