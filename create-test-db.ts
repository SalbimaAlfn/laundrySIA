import mysql from 'mysql2/promise';

async function main() {
  // Try connect to MySQL server without selecting DB
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
  });
  console.log('Connected to MySQL server');
  await connection.query('CREATE DATABASE IF NOT EXISTS laundrysia_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  console.log('Database laundrysia_test ensured');
  await connection.end();
}
main().catch(e => { console.error(e); process.exit(1); });
