import { config } from 'dotenv';
config({ path: '.env' });
import { db } from './src/server/db';

async function main() {
  const users = await db.user.findMany({ select: { id: true, username: true, isActive: true, role: true } });
  console.log('Users count:', users.length);
  console.log(users);
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
