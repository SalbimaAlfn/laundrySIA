import { config } from 'dotenv';
config({ path: '.env.test', override: true });
import { db } from './src/server/db';

async function main(){
  const tables = await db.$queryRaw`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='laundrysia_test'`;
  console.log('tables count', tables.length);
  console.log(tables.slice(0,20));
  await db.$disconnect();
}
main().catch(e=>{console.error(e);process.exit(1);});
