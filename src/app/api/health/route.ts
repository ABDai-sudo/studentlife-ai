import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Minimal public health probe — no internals. */
export async function GET() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return NextResponse.json(
    { status: dbOk ? "ok" : "degraded" },
    { status: dbOk ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
