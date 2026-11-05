import { config } from 'dotenv';
config({ path: '.env' });
import { db } from './src/server/db';
import { compare } from 'bcryptjs';

async function main() {
  const user = await db.user.findUnique({ where: { username: 'manager' }, select: { id: true, passwordHash: true, isActive: true } });
  console.log('user', user);
  if (user) {
    const ok = await compare('ChangeMe-Manager1', user.passwordHash);
    console.log('password matches?', ok);
  }
  await db.$disconnect();
}
main().catch(e=>{console.error(e);process.exit(1);});
