const { execSync } = require('child_process');
const mysql = require('mariadb');

// Check process
console.log('Checking MySQL process...');
try {
  const result = execSync('tasklist /fi "imagename eq mysqld.exe" /fo csv', { encoding: 'utf8' });
  console.log('Tasklist result:', result);
} catch (e) {
  console.log('tasklist error:', e.message);
}

// Check port
console.log('\nChecking port 3306...');
try {
  const result = execSync('netstat -an | findstr :3306', { encoding: 'utf8' });
  console.log('Netstat result:', result || '(no results)');
} catch (e) {
  console.log('netstat error:', e.message);
}

// Try connection with no password
console.log('\nTrying connection with no password...');
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'laundrysia',
  connectionLimit: 1,
  connectTimeout: 5000
});

async function test() {
  try {
    const conn = await pool.getConnection();
    console.log('Connected!');
    await conn.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Connect error:', err.code, '-', err.message);
    process.exit(1);
  }
}

test();