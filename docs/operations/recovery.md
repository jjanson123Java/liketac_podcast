# Like TAC recovery runbook

## Administrator account recovery

Use `/admin/recover`; do not use subscriber recovery. Reset instructions go to the security email in the administrator profile. A reset revokes sessions, trusted devices, and outstanding MFA challenges. The deployment bootstrap secret is not a daily-use password.

## Disable a compromised subscriber

Set the account status to `disabled` through an approved administrator operation, revoke its sessions, and record the reason in the audit trail. A disabled account must not receive private media. Avoid manual SQL except during an incident when the application is unavailable.

## Media recovery

Episode and media deletion is soft-delete in the first release. Restore metadata before attempting any Blob change. Do not delete a Blob object until the retention decision is explicit and a backup is confirmed.

## Database recovery

Identity and content are independent Neon resources. Confirm which database is affected before restoring. Test restoration on a Neon branch first, validate migrations and row counts, then schedule production recovery. Never restore one database over the other.

## Email outage

If the transactional email domain or provider is unavailable, administrator MFA and account recovery intentionally fail closed. Verify DNS/provider status; do not bypass MFA or expose codes in logs or webpages.

## Secret rotation

Rotate the affected Vercel environment variable, redeploy, revoke active sessions/tokens as appropriate, and verify recent audit/error logs. Never paste the replacement into GitHub, tickets, or chat.
