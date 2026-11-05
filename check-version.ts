import { config } from 'dotenv';
config({ path: '.env' });
import { db } from './src/server/db';

async function main(){
  const rows = await db.$queryRawUnsafe('SELECT VERSION() as version');
  console.log(rows);
  await db.$disconnect();
}
main().catch(e=>{console.error(e);process.exit(1);});
