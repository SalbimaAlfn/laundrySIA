import mysql from 'mysql2/promise';

async function testConnection() {
  try {
    console.log('Attempting to connect to MySQL...');
    const connection = await mysql.createConnection('mysql://root:cl@localhost:3306/laundrysia');
    console.log('✓ Connected successfully!');
    console.log('Server version:', connection.config.serverVersion);
    await connection.end();
    console.log('Connection closed successfully.');
  } catch (error) {
    console.error('✗ Connection failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error code:', (error as any).code);
    }
    process.exit(1);
  }
}

testConnection();