const fs = require('fs');
const path = 'C:\\xampp\\mysql\\bin\\my.ini';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
const newLines = [];

for (const line of lines) {
  newLines.push(line);
  if (line === 'port=3306' && line.startsWith('[mysqld]') === false) {
    if (!content.includes('default-authentication-plugin')) {
      newLines.push('default-authentication-plugin=mysql_native_password');
    }
  }
}

fs.writeFileSync(path, newLines.join('\n'));
console.log('my.ini updated with mysql_native_password');