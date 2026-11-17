@echo off
echo Testing direct MySQL connection...
C:\xampp\mysql\bin\mysql.exe --protocol=tcp -u root -p123456 -h 127.0.0.1 laundrysia -e "SELECT 1 AS test" 2>&1
echo.
echo Done
