import { config } from 'dotenv';
config({ path: '.env' });
import { db } from './src/server/db.js';

async function main() {
  const users = await db.user.findMany({ select: { id: true, username: true, isActive: true, role: true } });
  console.log('Users:', users);
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
