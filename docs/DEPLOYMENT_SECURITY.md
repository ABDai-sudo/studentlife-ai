# Deployment Security

## HTTPS only

Serve the app exclusively over HTTPS. Enable HSTS (already set in `next.config.ts`).

## Cookies

Production cookies are `Secure` + `HttpOnly` + `SameSite=Lax`. Set:

- `AUTH_SECRET` (long random)
- `AUTH_SESSION_MAX_AGE`
- `APP_BASE_URL` (canonical origin for CSRF/origin checks)

## Secrets

Store secrets in the host environment (Vercel/Project Settings). Never commit `.env`. Never prefix secrets with `NEXT_PUBLIC_`.

## Database

- Require TLS to Postgres when supported by provider
- Use a **least-privilege** runtime role (DML only)
- Use a separate migration role for schema changes
- Enable connection pooling (PgBouncer / Prisma Accelerate / provider pooler)
- Automated backups + restore drills

## Rate limiting & Vercel Firewall (if on Vercel)

Application limits exist, but add edge rules:

- Rate limit `/api/auth/*`
- Bot challenge on signup/login bursts
- Extra protection on `/admin` and `/api/admin/*`
- Block obvious scanners

Do not rely solely on the firewall.

## Preview deployments

- Do not grant OWNER on shared preview DBs with public URLs
- Prefer auth protection on preview deployments
- Never seed production secrets into public previews

## Monitoring

- Public `/api/health` → `{ status }` only
- Owner `/api/admin/health` for detailed status
- Wire uptime checks to the public endpoint

## CSP

CSP is **Report-Only**. After verifying no violations in production logs:

1. Copy policy from `next.config.ts`
2. Remove `'unsafe-eval'` if possible
3. Switch header name to `Content-Security-Policy`

## Debug output

Ensure `NODE_ENV=production`. Do not enable Prisma query logs in production.

## Owner MFA

MFA enforcement is incomplete until TOTP/WebAuthn is enabled and tested. Treat owner accounts with strong unique passwords and optional host SSO until then.
