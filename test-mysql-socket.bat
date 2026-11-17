@echo off
echo Testing direct MySQL connection via socket...
C:\xampp\mysql\bin\mysql.exe --protocol=socket -u root -p123456 laundrysia -e "SELECT 1 AS test" 2>&1
echo.
echo Done
