import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "adm@adm.com";
  const password = "123456";
  const name = "Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  const hash = await bcrypt.hash(password, 12);

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password: hash, name },
    });
    console.log("Senha atualizada para:", email);
  } else {
    await prisma.user.create({
      data: { email, name, password: hash },
    });
    console.log("Usuário criado:", email);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
