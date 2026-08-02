# Owner Administration Dashboard

Private route: `/admin`  
APIs: `/api/admin/*`

## Access

- Only users with `role = OWNER` and `status = ACTIVE`
- Server-side `requireOwner()` on every page and API
- Middleware redirects unauthenticated users to login (early filter only)
- Normal users redirected away from pages; APIs return 403

## Provisioning

```bash
npm run admin:grant -- --email="owner@example.com"
npm run admin:revoke -- --email="owner@example.com"
```

Role changes are written to `AuditLog`. No default admin account is created.

## Sections

| Path | Purpose |
|---|---|
| `/admin` | Overview metrics & charts |
| `/admin/live` | Approximate live activity (polling) |
| `/admin/users` | User management, CSV export, sensitive actions |
| `/admin/analytics` | Product analytics |
| `/admin/features` | Feature usage |
| `/admin/health` | System health |
| `/admin/errors` | Error monitoring |
| `/admin/security` | Security center |
| `/admin/audit` | Audit logs |
| `/admin/database` | DB connectivity & counts |
| `/admin/settings` | Retention / privacy settings |

Admin UI shows operational metadata only — not passwords, hashes, tokens, AI prompts, notes, or documents.

If Postgres is unavailable, admin pages render empty/error states instead of crashing.
