# Incident Response

## 1. Detect

Security Center spikes, error rate / health degradation, unusual owner login alerts, external reports.

## 2. Validate

Confirm signal is not a false positive. Capture `requestId` / audit log window. Do **not** paste secrets into tickets.

## 3. Contain

Suspend affected accounts, revoke sessions, tighten rate limits / firewall rules, disable compromised API keys.

## 4. Revoke sessions

Owner Users → Revoke sessions (password reauth). Or rotate `AUTH_SECRET` (forces all JWTs invalid — disruptive).

## 5. Rotate secrets

`AUTH_SECRET` → MFA/hash salts → database credentials → third-party AI keys.

## 6. Preserve logs

Export relevant `audit_logs`, `security_events`, `app_error_logs` before retention pruning.

## 7. Restore service

Confirm health endpoints and student login / dashboard flows.

## 8. Notify

Notify affected users when legally required or credentials may be compromised.

## 9. Root cause

Document timeline, impact, and contributing factors.

## 10. Preventive tests

Extend automated tests for the failure mode (authz, rate limit, redaction, export safety).
