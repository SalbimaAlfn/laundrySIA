const { spawn } = require('child_process');
const path = 'C:\\xampp\\mysql\\bin\\mysqld.exe';

const mysql = spawn(path, [
  '--defaults-file=C:\\xampp\\mysql\\bin\\my.ini',
  '--standalone'
], {
  cwd: 'C:\\xampp\\mysql'
});

mysql.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

mysql.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

mysql.on('close', (code) => {
  console.log(`MySQL exited with code ${code}`);
});

mysql.on('error', (err) => {
  console.error('Failed to start MySQL:', err.message);
});

console.log('MySQL starting in background...');