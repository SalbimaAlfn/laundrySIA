const { execSync } = require('child_process');

// Step 1: Stop MySQL
try {
  console.log('Stopping MySQL...');
  execSync('taskkill /f /im mysqld.exe 2>nul', { stdio: 'ignore' });
  console.log('MySQL stopped');
} catch (e) {
  console.log('MySQL not running or already stopped');
}

// Step 1b: Start MySQL via XAMPP
console.log('Starting MySQL via XAMPP...');
try {
  execSync('start "" "C:\\xampp\\mysql_start.bat"', { stdio: 'ignore' });
  console.log('MySQL start initiated');
} catch (e) {
  console.error('Failed to start MySQL:', e.message);
}

// Wait for MySQL to be ready
console.log('Waiting for MySQL to be ready...');
let mysqlReady = false;
for (let i = 0; i < 30; i++) {
  try {
    execSync('C:\\xampp\\mysql\\bin\\mysql.exe -u root -p123456 -e "SELECT 1;" 2>nul', { stdio: 'ignore' });
    mysqlReady = true;
    break;
  } catch (e) {
    // Not ready yet
  }
  require('timers').setTimeout(1000);
}

if (!mysqlReady) {
  console.error('MySQL did not become ready in time');
  process.exit(1);
}

console.log('MySQL is ready!');

// Step 2: Fix authentication plugin
console.log('Fixing authentication plugin...');
try {
  const result = execSync(
    'C:\\xampp\\mysql\\bin\\mysql.exe -u root -p123456 -e "ALTER USER \\'root\\'@\\'localhost\\' IDENTIFIED WITH mysql_native_password BY \\'123456\\'; FLUSH PRIVILEGES;"',
    { stdio: 'pipe' }
  );
  console.log('Authentication plugin fixed');
  console.log(result.toString());
} catch (e) {
  console.error('Failed to fix authentication plugin:', e.message);
}

// Step 3: Test the connection
console.log('Testing connection...');
try {
  const result = execSync(
    'C:\\xampp\\mysql\\bin\\mysql.exe -u root -p123456 -e "SELECT 1 AS test;"',
    { stdio: 'pipe' }
  );
  console.log('Connection successful!');
  console.log(result.toString());
} catch (e) {
  console.error('Connection failed:', e.message);
}