@echo off
echo Checking if MySQL is running...
echo Checking listening ports...
cmd.exe /c "netstat -an | findstr \"3306\"" 
echo.
echo The issue is that mysql client is trying to use caching_sha2_password plugin
echo This might be a MySQL 8.0 authentication issue, but we're using MariaDB 10.4
echo Let me try connecting with mysql client in MariaDB compatibility mode
