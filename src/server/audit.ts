import type { Prisma } from "@/generated/prisma/client";

export type AuditInput = {
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  detail?: Prisma.InputJsonValue;
};

/**
 * Writes one audit row through the caller's transaction. Business actions pass
 * their own `tx` so the audit row commits or rolls back with the change it
 * describes.
 */
export async function writeAudit(tx: Prisma.TransactionClient, input: AuditInput): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      detail: input.detail,
    },
  });
}
