import mysql from 'mysql2/promise';

async function testPassword(password: string) {
  console.log(`Testing password: "${password}"`);
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password,
      database: 'laundrysia'
    });
    console.log('✓ Connection successful with password:', password);
    await connection.end();
    return true;
  } catch (error) {
    console.error('✗ Failed with password:', password);
    return false;
  }
}

async function main() {
  console.log('=== Testing MySQL root password ===\n');

  const passwords = [
    '123456',
    'cl',
    '',
    'root',
    '1234',
    'password',
    'mysql'
  ];

  for (const pwd of passwords) {
    const success = await testPassword(pwd);
    if (success) break;
    console.log('');
  }

  console.log('\n=== Testing different authentication methods ===');
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'laundrysia'
    });
    console.log('✓ Connected with root @ 127.0.0.1 with empty password');
  } catch (e) {
    console.log('✗ 127.0.0.1 empty password failed');
  }
}

main().catch(console.error);