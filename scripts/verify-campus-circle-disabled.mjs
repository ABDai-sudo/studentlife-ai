/**
 * Expects FEATURE_CAMPUS_CIRCLE to be unset/false.
 * Confirms page, API, and nav stay inaccessible.
 */
const BASE = process.env.APP_BASE_URL || "http://127.0.0.1:3000";
const DEMO = {
  email: "demo@studentlife.ai",
  password: "Demo1234!",
};

async function parse(res) {
  const text = await res.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, headers: res.headers };
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
  const headers = { Origin: BASE };
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

async function main() {
  const results = [];
  const login = await req("/api/auth/login", {
    method: "POST",
    body: DEMO,
  });
  assert(login.status === 200 && login.cookie.includes("sl_session"), "login failed");
  const cookie = login.cookie;

  const apiGet = await req("/api/campus-circle", { cookie });
  results.push([
    "API GET disabled",
    apiGet.status === 403 && apiGet.json?.error?.code === "DISABLED",
  ]);

  const apiPost = await req("/api/campus-circle", {
    method: "POST",
    cookie,
    body: { action: "connect", email: "nobody@example.com" },
  });
  results.push([
    "API POST disabled",
    apiPost.status === 403 && apiPost.json?.error?.code === "DISABLED",
  ]);

  const page = await req("/dashboard/campus-circle", { cookie });
  const location = page.headers.get("location") || "";
  results.push([
    "page redirects while disabled",
    (page.status === 302 || page.status === 303 || page.status === 307 || page.status === 308) &&
      location.includes("/dashboard") &&
      !location.includes("campus-circle"),
  ]);

  const failed = results.filter(([, ok]) => !ok);
  for (const [name, ok] of results) {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  }
  if (failed.length) {
    console.error(`\n${failed.length} failed`);
    process.exit(1);
  }
  console.log(`\nAll ${results.length} disabled-flag checks passed.`);
}

main().catch((err) => {
  console.error("ERROR", err);
  process.exit(1);
});
