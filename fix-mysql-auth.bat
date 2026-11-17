@echo off
cd /D C:\xampp\mysql\bin

:: Stop any running MySQL instances
timeout /t 2 /nobreak > nul
taskkill /f /im mysqld.exe 2> nul

:: Start MySQL
echo Starting MySQL...
mysql_start.bat > nul 2>&1

:: Wait for MySQL to be ready
echo Waiting for MySQL to start...
for /L %i in (1,1,30) do (
    timeout /t 1 /nobreak > nul
    C:\xampp\mysql\bin\mysql.exe -u root -p123456 -e "SELECT 1;" 2> nul
    if %errorlevel% equ 0 (
        echo MySQL is ready!
        goto CONTINUE
    )
    if %i eq 30 (
        echo ERROR: MySQL did not start in time
        exit /b 1
    )
)

:CONTINUE
:: Fix the authentication plugin
echo Fixing authentication plugin...
C:\xampp\mysql\bin\mysql.exe -u root -p123456 -e "
    ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';
    FLUSH PRIVILEGES;
    SELECT 'Authentication plugin updated successfully';
" 2>&1

:: Test the connection
echo Testing connection...
C:\xampp\mysql\bin\mysql.exe -u root -p123456 -e "SELECT 1 AS test;" 2>&1

echo.
echo Done!