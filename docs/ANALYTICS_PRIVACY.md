# Analytics Privacy

StudentLife AI uses **first-party** product analytics for reliability and product improvement.

## What we collect

Allowlisted event names only (examples): `page_view`, `landing_page_view`, `signup_started`, `signup_completed`, `login_success`, `login_failure`, `logout`, feature opens such as `expense_module_opened`.

Optional safe metadata: path (query secrets stripped), device/browser category, referrer **domain**, anonymous id.

## What we do not collect

- Passwords, tokens, cookies, authorization headers
- AI prompt text / note contents / assignment bodies
- Full URLs with secret query parameters
- Precise location / continuous tracking
- Arbitrary nested client payloads

## Identifiers

Unauthenticated visitors may use an anonymous id. Events link to `userId` only after authentication where appropriate.

## Retention

Configurable via Owner Settings (defaults ~90 days for analytics).

## Legal note

This documentation describes technical privacy design. It is **not** a GDPR/CCPA/SOC 2 certification claim.
