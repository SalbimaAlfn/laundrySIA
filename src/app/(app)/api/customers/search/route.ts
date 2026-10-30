import { NextResponse } from "next/server";
import { phoneSearchTerm } from "@/lib/phone";
import { getSession } from "@/server/auth";
import { db } from "@/server/db";

/**
 * Type-ahead search for the order screen. Only active customers are returned,
 * because an inactive customer must not be attached to a new order.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ customers: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().slice(0, 80);
  if (query.length === 0) {
    return NextResponse.json({ customers: [] });
  }

  const digits = phoneSearchTerm(query);

  const customers = await db.customer.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query } },
        ...(digits.length > 0 ? [{ phone: { contains: digits } }] : []),
      ],
    },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
    take: 8,
  });

  return NextResponse.json({ customers });
}
