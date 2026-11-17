const pool = require('mariadb').createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'laundrysia',
  connectionLimit: 1
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error('Connection error:', err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  }
  console.log('Connected successfully!');
  conn.query('SELECT 1 AS test', (err, results) => {
    if (err) {
      console.error('Query error:', err);
    } else {
      console.log('Query result:', results);
    }
    conn.release();
    pool.end();
    process.exit(0);
  });
});