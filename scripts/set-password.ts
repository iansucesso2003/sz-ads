/**
 * Script para definir senha de um usuário existente.
 * Uso: npm run set-password -- <email> <senha>
 * Ex: npm run set-password -- iansucesso2003@gmail.com 123456
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Uso: npx tsx scripts/set-password.ts <email> <senha>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("Usuário não encontrado:", email);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email },
    data: { password: hash },
  });

  console.log("Senha atualizada com sucesso para:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
