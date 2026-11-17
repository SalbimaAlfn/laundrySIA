const { spawn } = require('child_process');
const mysql = spawn('C:\\xampp\\mysql\\bin\\mysqld.exe', {
  args: ['--defaults-file=C:\\xampp\\mysql\\bin\\my.ini'],
  cwd: 'C:\\xampp\\mysql',
  detached: true,
  stdio: 'ignore'
});

mysql.unref();
console.log('Starting MySQL...');

// Wait a bit and check if it's running
setTimeout(() => {
  const { execSync } = require('child_process');
  try {
    const result = execSync('tasklist /fi "imagename eq mysqld.exe" /fo csv', { encoding: 'utf8' });
    console.log('MySQL processes:', result);
  } catch (e) {
    console.log('Error:', e.message);
  }
}, 3000);