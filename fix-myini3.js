const fs = require('fs');
const path = 'C:\\xampp\\mysql\\bin\\my.ini';
const content = fs.readFileSync(path, 'utf8');

// Remove skip-grant-tables if present and ensure proper format
let newContent = content;
newContent = newContent.replace(/\n\[mysqld\]\n skip-grant-tables/g, '');
newContent = newContent.replace(/\nskip-grant-tables\n/g, '');

// Reset user password with mysql_native_password
fs.writeFileSync(path, newContent);
console.log('Restored my.ini');

// Now start MySQL and reset password
const { spawn } = require('child_process');
const mysql = spawn('C:\\xampp\\mysql\\bin\\mysqld.exe', {
  args: ['--defaults-file=C:\\xampp\\mysql\\bin\\my.ini', '--standalone'],
  cwd: 'C:\\xampp\\mysql'
});

mysql.stdout.on('data', (data) => console.log('stdout:', data.toString()));
mysql.stderr.on('data', (data) => console.log('stderr:', data.toString()));
mysql.on('close', (code) => console.log('MySQL exited with code', code));

console.log('MySQL starting...');