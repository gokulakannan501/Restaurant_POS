import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'gokulakannan317@gmail.com';
  const mobile = '6374038470';
  const name = 'Gokulakannan';
  const password = 'tempPassword123'; // Temporary password
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      mobile,
      role: 'ADMIN',
      permissions: JSON.stringify(['dashboard', 'menu', 'orders', 'billing', 'reports', 'settings', 'users']),
    },
    create: {
      name,
      email,
      mobile,
      password: hashedPassword,
      role: 'ADMIN',
      permissions: JSON.stringify(['dashboard', 'menu', 'orders', 'billing', 'reports', 'settings', 'users']),
      isFirstLogin: true,
    },
  });

  console.log('Admin user seeded:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
