/**
 * Local Campus Circle flow check. Not a production data seed.
 * Run against a server started with FEATURE_CAMPUS_CIRCLE=true.
 */
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const BASE = process.env.APP_BASE_URL || "http://127.0.0.1:3000";
const ORIGIN = BASE;
const DEMO = {
  email: "demo@studentlife.ai",
  password: "Demo1234!",
};

function stamp() {
  return Date.now().toString(36);
}

async function parse(res) {
  const json = await res.json().catch(() => null);
  return { status: res.status, json, headers: res.headers };
}

function cookieFrom(res) {
  const raw = res.headers.getSetCookie?.() || [];
  const parts = raw.length
    ? raw
    : [res.headers.get("set-cookie")].filter(Boolean);
  return parts
    .map((c) => String(c).split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function req(path, { method = "GET", cookie, body } = {}) {
  const headers = { Origin: ORIGIN };
  if (cookie) headers.Cookie = cookie;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const parsed = await parse(res);
  return { ...parsed, cookie: cookieFrom(res) || cookie || "" };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function login(email, password) {
  const res = await req("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert(res.status === 200 && res.json?.success, `login failed for ${email}: ${res.status} ${JSON.stringify(res.json)}`);
  assert(res.cookie.includes("sl_session"), "missing session cookie");
  return res.cookie;
}

async function signupAndOnboard() {
  const email = `campus.circle.${stamp()}@studentlife.test`;
  const password = "CircleTest9";
  const res = await req("/api/auth/signup", {
    method: "POST",
    body: { email, password, name: "Circle Partner" },
  });
  assert(res.status === 201 || res.status === 200, `signup failed: ${res.status} ${JSON.stringify(res.json)}`);
  const cookie = res.cookie || (await login(email, password));
  const onboard = await req("/api/profile", {
    method: "POST",
    cookie,
    body: {
      monthlyPocketMoney: 4000,
      studentType: "DAY_SCHOLAR",
      primaryGoal: "Study with classmates",
      country: "IN",
      currency: "INR",
    },
  });
  assert(onboard.json?.success, `onboard failed: ${JSON.stringify(onboard.json)}`);
  return { email, password, cookie };
}

async function main() {
  const results = [];
  const unauth = await req("/api/campus-circle");
  results.push(["unauthenticated GET", unauth.status === 401]);

  const aCookie = await login(DEMO.email, DEMO.password);
  const aMe = await req("/api/auth/me", { cookie: aCookie });
  results.push(["authenticated student A", aMe.status === 200 && Boolean(aMe.json?.data?.user?.id)]);

  const enabledGet = await req("/api/campus-circle", { cookie: aCookie });
  const enabled = enabledGet.json?.data?.enabled === true;
  results.push(["flag enabled for tests", enabled]);
  if (!enabled) {
    results.push(["skip remaining (flag off)", false]);
    console.log(results.map(([k, v]) => `${v ? "PASS" : "FAIL"}  ${k}`).join("\n"));
    process.exit(1);
  }

  const b = await signupAndOnboard();
  const bGet = await req("/api/campus-circle", { cookie: b.cookie });
  results.push(["student B overview", bGet.status === 200 && bGet.json?.data?.enabled === true]);

  const connect = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "connect", email: b.email },
  });
  results.push(["send connection request", connect.status === 200 && connect.json?.success]);

  const bNotifsAfterConnect = await req("/api/notifications", { cookie: b.cookie });
  const connectNotif = (bNotifsAfterConnect.json?.data?.notifications || []).find(
    (n) => n.category === "CAMPUS_CIRCLE" && n.metadata?.kind === "connection"
  );
  results.push([
    "B receives connection notification",
    bNotifsAfterConnect.status === 200 && Boolean(connectNotif?.id),
  ]);

  const dupConnect = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "connect", email: b.email },
  });
  results.push(["duplicate request rejected", dupConnect.status === 409]);

  const bOverview = await req("/api/campus-circle", { cookie: b.cookie });
  const incoming = bOverview.json?.data?.incomingRequests?.[0];
  results.push(["B sees incoming request", Boolean(incoming?.id)]);

  const accept = await req("/api/campus-circle", {
    method: "POST",
    cookie: b.cookie,
    body: { action: "respond_connection", connectionId: incoming.id, accept: true },
  });
  results.push(["accept connection", accept.status === 200 && accept.json?.success]);

  const aRefresh = await req("/api/campus-circle", { cookie: aCookie });
  const bRefresh = await req("/api/campus-circle", { cookie: b.cookie });
  results.push([
    "refresh persistence A still connected",
    Boolean(aRefresh.json?.data?.connections?.find((c) => c.user.id)),
  ]);
  results.push([
    "refresh persistence B still connected",
    Boolean(bRefresh.json?.data?.connections?.find((c) => c.user.id)),
  ]);

  const aAfter = await req("/api/campus-circle", { cookie: aCookie });
  const partner = aAfter.json?.data?.connections?.find((c) => c.user.id);
  results.push(["A sees accepted connection", Boolean(partner)]);
  const partnerId = partner?.user?.id;

  const fakeId = "clxxxxxxxxxxxxxxxxxxxxxx";
  const idorGroup = await req(`/api/campus-circle?groupId=${fakeId}`, { cookie: aCookie });
  results.push([
    "invalid group id rejected",
    idorGroup.status === 422 || idorGroup.status === 403 || idorGroup.status === 404,
  ]);

  const otherGroup = await req("/api/campus-circle", {
    method: "POST",
    cookie: b.cookie,
    body: { action: "create_group", name: "Exam prep circle" },
  });
  results.push(["create private group", otherGroup.status === 200 && Boolean(otherGroup.json?.data?.id)]);
  const groupId = otherGroup.json?.data?.id;

  const aSteal = await req(`/api/campus-circle?groupId=${groupId}`, { cookie: aCookie });
  results.push([
    "non-member cannot load group",
    aSteal.status === 403,
  ]);

  const inviteStudy = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "study_invite", userId: partnerId, topic: "Physics" },
  });
  results.push(["study invite", inviteStudy.status === 200 && inviteStudy.json?.success]);

  const bNotifsStudy = await req("/api/notifications", { cookie: b.cookie });
  const studyNotif = (bNotifsStudy.json?.data?.notifications || []).find(
    (n) => n.category === "CAMPUS_CIRCLE" && n.metadata?.kind === "study_invite"
  );
  results.push(["B receives study invite notification", Boolean(studyNotif?.id)]);

  if (connectNotif?.id) {
    const stealNotif = await req("/api/notifications", {
      method: "POST",
      cookie: aCookie,
      body: { action: "mark_read", id: connectNotif.id },
    });
    results.push([
      "A cannot mark B notification (IDOR)",
      stealNotif.status === 404 || stealNotif.status === 403,
    ]);
  } else {
    results.push(["A cannot mark B notification (IDOR)", false]);
  }

  const dupStudy = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "study_invite", userId: partnerId, topic: "Physics" },
  });
  results.push(["duplicate study invite rejected", dupStudy.status === 409]);

  const bInvites = await req("/api/campus-circle", { cookie: b.cookie });
  const studyIn = bInvites.json?.data?.studyInvites?.incoming?.find((i) => i.status === "PENDING");
  const acceptStudy = await req("/api/campus-circle", {
    method: "POST",
    cookie: b.cookie,
    body: { action: "respond_study_invite", inviteId: studyIn.id, accept: true },
  });
  results.push(["accept study invite", acceptStudy.status === 200]);

  const quiz = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "quiz_challenge", userId: partnerId },
  });
  results.push(["quiz challenge", quiz.status === 200]);

  const bNotifsQuiz = await req("/api/notifications", { cookie: b.cookie });
  const quizNotif = (bNotifsQuiz.json?.data?.notifications || []).find(
    (n) => n.category === "CAMPUS_CIRCLE" && n.metadata?.kind === "quiz_challenge"
  );
  results.push(["B receives Quiz Rush notification", Boolean(quizNotif?.id)]);
  const dupQuiz = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "quiz_challenge", userId: partnerId },
  });
  results.push(["duplicate quiz challenge rejected", dupQuiz.status === 409]);

  const recap = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "share_recap", userId: partnerId },
  });
  results.push(["explicit recap share", recap.status === 200]);
  const recapPayload = recap.json?.data?.payload;
  results.push([
    "recap has no money/score/email",
    recapPayload &&
      !("moneySaved" in recapPayload) &&
      !("averageScore" in recapPayload) &&
      !("email" in recapPayload),
  ]);

  const groupInvite = await req("/api/campus-circle", {
    method: "POST",
    cookie: b.cookie,
    body: { action: "invite_to_group", groupId, userId: aMe.json.data.user.id },
  });
  results.push(["group invite to connection", groupInvite.status === 200]);
  const aGroups = await req("/api/campus-circle", { cookie: aCookie });
  const gInv = aGroups.json?.data?.groupInvites?.[0];
  const join = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "respond_group_invite", inviteId: gInv.id, accept: true },
  });
  results.push(["join group by invite", join.status === 200]);

  const aPrivateGroup = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "create_group", name: "A only circle" },
  });
  const aOnlyGroupId = aPrivateGroup.json?.data?.id;
  const bStealAGroup = await req(`/api/campus-circle?groupId=${aOnlyGroupId}`, {
    cookie: b.cookie,
  });
  results.push([
    "B cannot load A's unshared group (IDOR)",
    bStealAGroup.status === 403 || bStealAGroup.status === 404,
  ]);
  const bInviteSelf = await req("/api/campus-circle", {
    method: "POST",
    cookie: b.cookie,
    body: { action: "invite_to_group", groupId: aOnlyGroupId, userId: aMe.json.data.user.id },
  });
  results.push([
    "B cannot invite into A's group",
    bInviteSelf.status === 403 || bInviteSelf.status === 404,
  ]);

  const activity = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "post_activity", groupId, kind: "CHECK_IN", body: "Revision block 1" },
  });
  results.push(["group activity as member", activity.status === 200]);

  const react = await req("/api/campus-circle", {
    method: "POST",
    cookie: b.cookie,
    body: {
      action: "react",
      targetType: "ACTIVITY",
      targetId: activity.json.data.id,
      kind: "ENCOURAGE",
    },
  });
  results.push(["reaction persisted", react.status === 200]);
  const reactDup = await req("/api/campus-circle", {
    method: "POST",
    cookie: b.cookie,
    body: {
      action: "react",
      targetType: "ACTIVITY",
      targetId: activity.json.data.id,
      kind: "ENCOURAGE",
    },
  });
  results.push(["duplicate reaction safe", reactDup.status === 200]);

  const report = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "report", targetType: "USER", targetId: partnerId, reason: "spam" },
  });
  results.push(["report", report.status === 200]);
  const reportDup = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "report", targetType: "USER", targetId: partnerId, reason: "spam" },
  });
  results.push(["duplicate report safe", reportDup.status === 200]);
  const groupReport = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: {
      action: "report",
      targetType: "GROUP",
      targetId: aOnlyGroupId,
      reason: "other",
      details: "E2E moderation inbox",
    },
  });
  results.push(["report private group", groupReport.status === 200]);

  const aAdmin = await req("/api/admin/campus-reports", { cookie: aCookie });
  const bAdmin = await req("/api/admin/campus-reports", { cookie: b.cookie });
  results.push([
    "student A has zero admin report access",
    aAdmin.status === 401 || aAdmin.status === 403,
  ]);
  results.push([
    "student B has zero admin report access",
    bAdmin.status === 401 || bAdmin.status === 403,
  ]);

  const ownerProbe = await signupAndOnboard();
  const prisma = new PrismaClient();
  let ownerRestored = false;
  try {
    await prisma.user.update({
      where: { email: ownerProbe.email },
      data: { role: "OWNER" },
    });
    const ownerCookie = await login(ownerProbe.email, ownerProbe.password);
    const inbox = await req("/api/admin/campus-reports?status=ALL", {
      cookie: ownerCookie,
    });
    const listed = inbox.json?.data?.reports || [];
    const found = listed.find(
      (r) => r.targetType === "GROUP" && r.targetId === aOnlyGroupId
    );
    results.push(["owner lists campus reports", inbox.status === 200 && Boolean(found?.id)]);
    if (found?.id) {
      const detail = await req(`/api/admin/campus-reports?id=${found.id}`, {
        cookie: ownerCookie,
      });
      const detailBody = JSON.stringify(detail.json || {});
      results.push([
        "owner can review report details",
        detail.status === 200 && detail.json?.data?.id === found.id,
      ]);
      results.push([
        "moderation payload has no money fields",
        !detailBody.includes("monthlyPocketMoney") &&
          !detailBody.includes("passwordHash"),
      ]);
      const reviewed = await req("/api/admin/campus-reports", {
        method: "POST",
        cookie: ownerCookie,
        body: { id: found.id, status: "REVIEWED", note: "Reviewed in E2E" },
      });
      results.push([
        "owner safe resolution to REVIEWED",
        reviewed.status === 200 && reviewed.json?.data?.status === "REVIEWED",
      ]);
      const studentResolve = await req("/api/admin/campus-reports", {
        method: "POST",
        cookie: aCookie,
        body: { id: found.id, status: "DISMISSED" },
      });
      results.push([
        "student cannot resolve reports",
        studentResolve.status === 401 || studentResolve.status === 403,
      ]);
    } else {
      results.push(["owner can review report details", false]);
      results.push(["moderation payload has no money fields", false]);
      results.push(["owner safe resolution to REVIEWED", false]);
      results.push(["student cannot resolve reports", false]);
    }
    await prisma.user.update({
      where: { email: ownerProbe.email },
      data: { role: "USER" },
    });
    ownerRestored = true;
  } finally {
    if (!ownerRestored) {
      await prisma.user.update({
        where: { email: ownerProbe.email },
        data: { role: "USER" },
      }).catch(() => {});
    }
    await prisma.$disconnect();
  }

  const block = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "block", userId: partnerId },
  });
  results.push(["block", block.status === 200]);
  const blockedInvite = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "study_invite", userId: partnerId, topic: "Nope" },
  });
  results.push(["blocked student cannot be invited", blockedInvite.status === 403]);
  const unblock = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "unblock", userId: partnerId },
  });
  results.push(["unblock", unblock.status === 200]);

  const privacy = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "update_privacy", shareStudyStatus: true, studyStatus: "FOCUSING" },
  });
  results.push(["privacy/study status update", privacy.status === 200]);

  const declineUser = await signupAndOnboard();
  const req2 = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "connect", email: declineUser.email },
  });
  const dOverview = await req("/api/campus-circle", { cookie: declineUser.cookie });
  const dIncoming = dOverview.json?.data?.incomingRequests?.[0];
  const declined = await req("/api/campus-circle", {
    method: "POST",
    cookie: declineUser.cookie,
    body: { action: "respond_connection", connectionId: dIncoming.id, accept: false },
  });
  results.push(["decline connection", req2.status === 200 && declined.status === 200]);

  const bogus = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "respond_connection", connectionId: incoming.id, accept: true },
  });
  results.push(["cannot accept someone else's leftover request by id", bogus.status === 404 || bogus.status === 409]);

  const bStealDecline = await req("/api/campus-circle", {
    method: "POST",
    cookie: b.cookie,
    body: { action: "respond_connection", connectionId: dIncoming.id, accept: true },
  });
  results.push([
    "B cannot accept A's other request (IDOR)",
    bStealDecline.status === 404 || bStealDecline.status === 403,
  ]);
  const aStealStudy = await req("/api/campus-circle", {
    method: "POST",
    cookie: aCookie,
    body: { action: "respond_study_invite", inviteId: studyIn.id, accept: true },
  });
  results.push([
    "A cannot accept B's study invite by id (IDOR)",
    aStealStudy.status === 404 || aStealStudy.status === 409 || aStealStudy.status === 403,
  ]);

  const failed = results.filter(([, ok]) => !ok);
  for (const [name, ok] of results) {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  }
  if (failed.length) {
    console.error(`\n${failed.length} failed`);
    process.exit(1);
  }
  console.log(`\nAll ${results.length} Campus Circle API checks passed.`);
}

main().catch((err) => {
  console.error("ERROR", err);
  process.exit(1);
});
