require('dotenv').config();
const mysql = require('mariadb');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'laundrysia',
  connectionLimit: 1,
  connectTimeout: 10000
});

async function test() {
  try {
    const conn = await pool.getConnection();
    console.log('Connected!');
    const result = await conn.query('SELECT 1 AS test');
    console.log('Result:', result);
    await conn.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    process.exit(1);
  }
}

test();