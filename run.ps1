cd D:\LaundrySIA
node list.js | Out-String -Stream | ForEach-Object { $_ }
