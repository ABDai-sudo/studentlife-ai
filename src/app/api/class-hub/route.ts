import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import {
  createAnnouncement,
  joinOrCreateHub,
  leaveHub,
  listAnnouncements,
  listMyHub,
  reportContent,
} from "@/services/class-hub.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hubId");
    if (hubId) {
      const rows = await listAnnouncements(user.id, hubId);
      return ok(rows);
    }
    return ok(await listMyHub(user.id));
  } catch (error) {
    if (String(error).includes("FORBIDDEN")) {
      return fail("Access denied", { code: "FORBIDDEN", status: 403 });
    }
    return serverError("Could not load class hub.");
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await request.json().catch(() => null);
    const action = z
      .discriminatedUnion("action", [
        z.object({
          action: z.literal("join"),
          institution: z.string().trim().min(1).max(200),
          course: z.string().trim().min(1).max(200),
          semester: z.string().trim().min(1).max(80),
          inviteCode: z.string().trim().max(32).optional(),
        }),
        z.object({
          action: z.literal("leave"),
          hubId: z.string().cuid(),
        }),
        z.object({
          action: z.literal("announce"),
          hubId: z.string().cuid(),
          title: z.string().trim().min(1).max(160),
          body: z.string().trim().min(1).max(5000),
        }),
        z.object({
          action: z.literal("report"),
          hubId: z.string().cuid(),
          targetType: z.string().trim().min(1).max(40),
          targetId: z.string().trim().min(1).max(64),
          reason: z.string().trim().min(1).max(2000),
        }),
      ])
      .safeParse(body);

    if (!action.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: action.error.flatten(),
      });
    }

    const data = action.data;
    if (data.action === "join") {
      const hub = await joinOrCreateHub(user.id, data);
      return ok(hub);
    }
    if (data.action === "leave") {
      await leaveHub(user.id, data.hubId);
      return ok({ left: true });
    }
    if (data.action === "announce") {
      const row = await createAnnouncement(
        user.id,
        data.hubId,
        data.title,
        data.body
      );
      return ok(row);
    }
    const report = await reportContent(
      user.id,
      data.hubId,
      data.targetType,
      data.targetId,
      data.reason
    );
    return ok(report);
  } catch (error) {
    const msg = String(error);
    if (msg.includes("DISABLED")) {
      return fail("Class Hub is disabled.", {
        code: "FORBIDDEN",
        status: 403,
      });
    }
    if (msg.includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    if (msg.includes("FORBIDDEN")) {
      return fail("Access denied", { code: "FORBIDDEN", status: 403 });
    }
    return serverError("Class Hub action failed.");
  }
}
