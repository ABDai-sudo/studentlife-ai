# Security Architecture

StudentLife AI uses defense-in-depth controls aligned with OWASP ASVS 5.0 principles. This document does **not** claim the application is unhackable or certified.

## Authentication model

- Email + password accounts
- Passwords hashed with **bcrypt** (cost factor 12)
- Sessions are JWT cookies (`sl_session`): HttpOnly, Secure in production, SameSite=Lax, Path=/
- Successful login issues a **new** session token (session fixation mitigation)
- Suspended / disabled accounts cannot authenticate
- Login failures use a generic message (no email enumeration)
- Progressive delay on repeated failures + application rate limits

## Authorization model

- Database `User.role` is the source of truth (`USER` | `OWNER`)
- Server helpers: `requireAuthenticatedUser()`, `requireOwner()` / `requireOwnerPage()`
- Every `/admin` page and `/api/admin/*` route independently calls owner authorization
- Middleware only checks session **presence** for `/admin` as an early filter — **not** sufficient alone
- Client-side role values are never trusted

## Session model

- Cookie JWT for request authentication
- Optional `AuthSession` rows store **hashed** session tokens for revocation
- Logout revokes matching session rows and clears the cookie

## Owner-access model

1. Create a normal user account through signup
2. Grant OWNER via CLI (never hardcoded):
   ```bash
   npm run admin:grant -- --email="you@example.com"
   ```
3. Revoke with:
   ```bash
   npm run admin:revoke -- --email="you@example.com"
   ```
4. Access `/admin` while authenticated as that owner

Unauthorized admin attempts are audit-logged with severity HIGH.

## Rate limiting

In-memory counters keyed by HMAC IP identifier and/or account. Configurable via `RATE_LIMIT_*` env vars. For multi-instance production, replace with Redis / edge limits.

## Logging and redaction

`src/lib/security/safe-log.ts` redacts password/token/session/cookie/authorization/secret/apiKey/databaseUrl/recoveryCode/totpSecret keys; strips CRLF; truncates fields.

## Security headers

Configured in `next.config.ts` (HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame denial, COOP/CORP, CSP Report-Only).

## Secret management

Server-only secrets must **not** use `NEXT_PUBLIC_`. Never commit `.env`.

## Database security

Prisma query API only. Explicit field selects / DTOs for admin APIs. Recommended: separate migration vs runtime DB roles.

## Backup recommendations

Configure automated backups on the managed Postgres provider; test restores quarterly.

## Dependency updates

Run `npm audit` in CI. Prefer Dependabot. Do not use `npm audit fix --force` blindly.

## Vulnerability reporting

Email the project owner privately. Do not open public issues containing exploit details for unfixed flaws.

## Known limitations / not yet fully implemented

| Control | Status |
|---|---|
| OWNER MFA (TOTP/WebAuthn) enforcement | Models + settings UI only — **not enforced** |
| Distributed rate limiting | In-memory only |
| CSP enforcement | Report-Only |
| Password reset / email verification flows | Not fully productized |
| Full API latency instrumentation | Partial |
| Integration tests for full HTTP authz with live DB | Unit/contract tests present; E2E needs DB |

## Features planned but incomplete

- Mandatory OWNER MFA with encrypted TOTP secrets + hashed recovery codes
- Aggregate jobs for DailyAnalyticsAggregate / retention pruning
