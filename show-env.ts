import { config } from 'dotenv';
config({ path: '.env' });
console.log('DATABASE_URL =', JSON.stringify(process.env.DATABASE_URL));
console.log('SESSION_SECRET length =', process.env.SESSION_SECRET?.length);
