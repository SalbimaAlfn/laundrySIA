import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export type AuditFilter = {
  userId?: number;
  action?: string;
  from?: string;
  to?: string;
};

export async function getAuditLogs(filter: AuditFilter) {
  const where: Prisma.AuditLogWhereInput = {};
  if (filter.userId) where.userId = filter.userId;
  if (filter.action) where.action = filter.action;
  if (filter.from || filter.to) {
    where.createdAt = {
      ...(filter.from ? { gte: new Date(`${filter.from}T00:00:00+07:00`) } : {}),
      ...(filter.to ? { lte: new Date(`${filter.to}T23:59:59.999+07:00`) } : {}),
    };
  }

  const logs = await db.auditLog.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return logs.map((log) => ({
    id: log.id,
    userName: log.user?.name ?? "—",
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    createdAt: log.createdAt.toISOString(),
  }));
}

export async function getAuditFilterOptions() {
  const [users, actions] = await Promise.all([
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
  ]);
  return { users, actions: actions.map((row) => row.action) };
}
