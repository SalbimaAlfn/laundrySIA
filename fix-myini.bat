@echo off
copy C:\xampp\mysql\bin\my.ini C:\xampp\mysql\bin\my.ini.backup
echo Adding default-authentication-plugin=mysql_native_password to my.ini...

(for /f "delims=" %%a in (C:\xampp\mysql\bin\my.ini) do (
    echo %%a
    if "%%a"=="port=3306" echo default-authentication-plugin=mysql_native_password
)) > C:\xampp\mysql\bin\my.ini.new

move C:\xampp\mysql\bin\my.ini.new C:\xampp\mysql\bin\my.ini
echo Done