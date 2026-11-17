const { spawn } = require('child_process');

function runMysqlQuery(query) {
  return new Promise((resolve, reject) => {
    const mysql = spawn('C:\\xampp\\mysql\\bin\\mysql.exe', [
      '-u', 'root',
      '-p123456',
      '-e',
      query
    ]);
    
    let output = '';
    let error = '';
    
    mysql.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    mysql.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    mysql.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(error || `Process exited with code ${code}`));
      }
    });
  });
}

(async () => {
  try {
    // Wait for MySQL to be available
    console.log('Waiting for MySQL...');
    for (let i = 0; i < 30; i++) {
      try {
        await runMysqlQuery('SELECT 1;');
        console.log('MySQL is ready!');
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    // Fix authentication plugin
    console.log('Fixing authentication plugin...');
    await runMysqlQuery(
      "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';"
    );
    await runMysqlQuery('FLUSH PRIVILEGES;');
    console.log('Authentication plugin fixed!');
    
    // Test connection
    console.log('Testing connection...');
    const result = await runMysqlQuery('SELECT 1 AS test;');
    console.log('Success! Result:', result.trim());
    
  } catch (e) {
    console.error('Error:', e.message);
  }
})();