const mysql = require('mariadb');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'laundrysia',
  connectionLimit: 10
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Connection error:', err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  }
  console.log('Connected successfully!');
  connection.query('SELECT 1 AS test', (err, results) => {
    if (err) {
      console.error('Query error:', err);
    } else {
      console.log('Query result:', results);
    }
    connection.release();
    pool.end();
    process.exit(0);
  });
});