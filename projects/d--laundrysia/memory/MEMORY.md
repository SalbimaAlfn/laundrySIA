---
name: Database Connection Troubleshooting - Pool Error 45028
description: Direct mysql2 connection works with MySQL credentials but Prisma MariaDB adapter pool fails with code 45028
type: project
category: troubleshooting
keywords:
  - prisma connection pool
  - maria db adapter
  - mysql8
  - database failure
usage_scenarios:
  - "debug Prisma connection pool issues"
  - "troubleshoot 45028 pool error"
  - "investigate MariaDB adapter compatibility"
---

Direct mysql2 connection test passed with:
- User: root
- Password: 123456  
- Database: laundrysia
- Host: localhost:3306

The app still shows "Tidak dapat masuk sekarang. Coba lagi sebentar lagi" due to database connection failure in authentication flow.

Prisma db check fails with:
Invalid `prisma.$queryRaw()` invocation:
Raw query failed. Code: `45028`. Message: `pool failed to retrieve a connection from pool (pool connections: active=0 idle=0 limit=10)`

This suggests Prisma MariaDB adapter compatibility issue with MySQL 8.0 server even though direct mysql2 works.