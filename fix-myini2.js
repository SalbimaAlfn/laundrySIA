const fs = require('fs');
const path = 'C:\\xampp\\mysql\\bin\\my.ini';
const content = fs.readFileSync(path, 'utf8');

// Add skip-grant-tables to start MariaDB in safe mode for password reset
const newContent = content + '\n[mysqld]\n skip-grant-tables\n';
fs.writeFileSync(path, newContent);
console.log('Added skip-grant-tables to my.ini');