import { config } from 'dotenv';
config({ path: '.env.test', override: true });
import { db } from './src/server/db';

async function main(){
  console.log('DATABASE_URL', process.env.DATABASE_URL);
  const rows = await db.$queryRaw`SELECT 1 as ok`;
  console.log('OK', rows);
  await db.$disconnect();
}
main().catch(e=>{console.error(e);process.exit(1);});
