import { config } from 'dotenv';
config({ path: '.env' });
import { db } from './src/server/db';

async function main(){
  console.log('Testing Prisma raw query...');
  try{
    const rows = await db.$queryRaw`SELECT 1 AS ok`;
    console.log('Success', rows);
  }catch(e){
    console.error('Error', e);
  }finally{
    await db.$disconnect();
  }
}
main();
