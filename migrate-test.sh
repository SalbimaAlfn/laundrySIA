#!/usr/bin/env bash
cd D:\LaundrySIA
export DOTENV_CONFIG_PATH=.env.test
npx prisma migrate deploy --schema prisma/schema.prisma
