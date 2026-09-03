import { z } from "zod";
import {
  CAMPUS_REACTION_KINDS,
  CAMPUS_REPORT_REASONS,
  CAMPUS_REPORT_TARGETS,
  CAMPUS_STUDY_STATUSES,
} from "@/lib/campus-circle/privacy";

const cuid = z.string().cuid();
const email = z.string().trim().email().max(254).toLowerCase();

export const campusCircleActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("update_privacy"),
      studyStatus: z.enum(CAMPUS_STUDY_STATUSES).optional(),
      shareStudyStatus: z.boolean().optional(),
      allowConnectionRequests: z.boolean().optional(),
      allowStudyInvites: z.boolean().optional(),
      allowQuizChallenges: z.boolean().optional(),
      allowGroupInvites: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("connect"),
      email,
    })
    .strict(),
  z
    .object({
      action: z.literal("respond_connection"),
      connectionId: cuid,
      accept: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("remove_connection"),
      userId: cuid,
    })
    .strict(),
  z
    .object({
      action: z.literal("block"),
      userId: cuid,
    })
    .strict(),
  z
    .object({
      action: z.literal("unblock"),
      userId: cuid,
    })
    .strict(),
  z
    .object({
      action: z.literal("report"),
      targetType: z.enum(CAMPUS_REPORT_TARGETS),
      targetId: z.string().trim().min(1).max(64),
      reason: z.enum(CAMPUS_REPORT_REASONS),
      details: z.string().trim().max(2000).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("study_invite"),
      userId: cuid,
      topic: z.string().trim().max(80).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("respond_study_invite"),
      inviteId: cuid,
      accept: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("quiz_challenge"),
      userId: cuid,
    })
    .strict(),
  z
    .object({
      action: z.literal("respond_quiz_challenge"),
      challengeId: cuid,
      accept: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("share_recap"),
      userId: cuid,
    })
    .strict(),
  z
    .object({
      action: z.literal("create_group"),
      name: z.string().trim().min(2).max(80),
    })
    .strict(),
  z
    .object({
      action: z.literal("invite_to_group"),
      groupId: cuid,
      userId: cuid,
    })
    .strict(),
  z
    .object({
      action: z.literal("respond_group_invite"),
      inviteId: cuid,
      accept: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("leave_group"),
      groupId: cuid,
    })
    .strict(),
  z
    .object({
      action: z.literal("post_activity"),
      groupId: cuid,
      kind: z.enum(["CHECK_IN", "PLAN", "NOTE"]).optional(),
      body: z.string().trim().min(1).max(500),
    })
    .strict(),
  z
    .object({
      action: z.literal("react"),
      targetType: z.enum(["SHARE", "ACTIVITY"]),
      targetId: cuid,
      kind: z.enum(CAMPUS_REACTION_KINDS),
    })
    .strict(),
]);

export type CampusCircleAction = z.infer<typeof campusCircleActionSchema>;
