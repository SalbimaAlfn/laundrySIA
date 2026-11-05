import { config } from 'dotenv';
config({ path: '.env' });
import { db } from './src/server/db';

async function main(){
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, action: true, entityType: true, entityId: true, detail: true, createdAt: true } });
  console.log(JSON.stringify(logs, null, 2));
  await db.$disconnect();
}
main().catch(e=>{console.error(e);process.exit(1);});
