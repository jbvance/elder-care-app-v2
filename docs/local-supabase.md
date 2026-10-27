# Local Supabase verification checkpoint - 2026-10-27

**Infrastructure verified; running on localhost only.** The user approved this
infrastructure checkpoint and its focused final review/commit. Application
authentication implementation awaits separate continuation. Ticket 01 remains
incomplete; ticket 02 acceptance is not established by these infrastructure checks.

## Reproducible tooling and services

Root npm development dependency `supabase` is exactly pinned at **2.122.0** in
`package.json` and `package-lock.json`; use `npm ci` to reproduce installation.
Node is 24.14.0; npm 11.9.0. Installation audit: zero root tooling vulnerabilities.
Mobile dependencies are unchanged. Docker Desktop 4.97.0 uses client/server
29.9.2, context `desktop-linux`, and the Linux engine.

| Container suffix before `_elder-care-app-v2` | Image under `public.ecr.aws/supabase/` | Verified state |
| --- | --- | --- |
| `supabase_db` | `postgres:17.11.0.006` | healthy; PostgreSQL 17.11 |
| `supabase_auth` | `gotrue:v2.197.0` | healthy |
| `supabase_kong` | `kong:2.8.1` | healthy |
| `supabase_rest` | `postgrest:v16.5` | running; HTTP reachable |
| `supabase_inbucket` (legacy name; actually Mailpit) | `mailpit:v1.31.3` | healthy |

Studio, Storage, Realtime, image processing, Edge Functions, analytics and pooling
are disabled/excluded. `supabase/migrations/` is ready for subsequent reviewed
migrations. No application tables, ownership policies or care information exist.

Run commands from the repository root with Docker's CLI available on PATH:

```powershell
.\node_modules\.bin\supabase.cmd start --network-id elder-care-app-v2-local --exclude realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
node scripts/verify-local-supabase.mjs health
.\node_modules\.bin\supabase.cmd stop
```

`stop` preserves the database volume. Never add `--no-backup`, remove volumes,
or use broad Docker cleanup for this workflow. Raw CLI start/status may show
local credentials; do not paste their output into reports.

## Loopback restriction verified

The original startup published on `0.0.0.0` and `::` despite the dedicated bridge
network's `com.docker.network.bridge.host_binding_ipv4=127.0.0.1` option. Services
were stopped immediately before any authentication tests. An inert probe reproduced
this independently of Supabase. No firewall or system-security setting was changed
by the agent.

The user approved and personally changed Docker Desktop to **Localhost by default**.
A fresh disposable `sleep` probe used the existing official Postgres image on
`elder-care-app-v2-local`, publishing host port 54328. Docker mappings and actual
Windows TCP listeners both showed **127.0.0.1 and ::1 only**. The probe was stopped
and automatically removed, with no volumes or unrelated resources removed.

Supabase then started on its existing network and original database volume.
Docker mappings and Windows listeners were verified before authentication requests,
and rechecked after stop/restart. Only the following host ports were published,
on **127.0.0.1 and ::1**, with no wildcard addresses:

| Service | Local interface |
| --- | --- |
| Kong API / PostgREST | `http://127.0.0.1:54321` / `/rest/v1/` |
| Auth through Kong | `http://127.0.0.1:54321/auth/v1` |
| PostgreSQL | `127.0.0.1:54322` |
| Mailpit UI / API | `http://127.0.0.1:54324` |

Auth and PostgREST have no separately published host ports. Studio 54323 and
optional host SMTP/POP ports are disabled. Port 54320 is reserved for future
schema-diff shadow databases. If any mapping or listener becomes non-loopback,
stop this project immediately; do not change firewall rules to work around it.
The network remains dedicated to this project; Desktop's localhost default is
also required on this computer.

## Connectivity and numeric email evidence

Verified before and after restart:

- Pinned CLI status succeeds; all five required containers run; configured Docker
  health checks pass. PostgREST has no Docker healthcheck but responds through Kong.
- PostgreSQL accepts host TCP connections at 127.0.0.1:54322; an actual SQL query
  inside the database container succeeds. Server reports PostgreSQL 17.11.
- Auth `/health`, PostgREST `/rest/v1/`, Mailpit UI and Mailpit message API return 200.
- Effective Auth environment: numeric OTP length 6; expiry 600 seconds; resend
  minimum 1 minute; email autoconfirm disabled; JWT expiry 3600 seconds; verification
  rate limit 30; local inactivity 720 hours; SMTP points only to the local Mailpit
  container at port 1025. No fixed session timebox is configured.
- Signup for fictional `infra-probe-20261027@example.test` captured an email in
  Mailpit with a six-digit code and no magic link. Direct immediate resend returned
  **429**. The code was exchanged successfully for a confirmed Auth session, then
  that fixture session was signed out using local scope. No code, key or token was
  printed or saved by the verification script.
- `supabase stop` succeeded; project containers and service listeners disappeared.
  Restart succeeded using the same network/exclusions. The database volume's
  creation timestamp was unchanged, and the same synthetic identity persisted.
- Returning-user OTP captured a fresh numeric email, again denied immediate resend
  with 429, and authenticated the same identity. The fixture session was signed out.

`node scripts/verify-local-supabase.mjs health` repeats non-email smoke checks.
Modes `signup` and `returning` exercise the fixed fictional fixture; `signup`
requires it to be absent, and `returning` requires it to exist. Respect the resend
interval before rerunning. The script checks only newly captured Mailpit messages.
Its HTTP requests reject redirects to prevent accidental external requests.
Its stdout contains verdicts, never response bodies or credentials. The synthetic
user remains in the local database; Mailpit may retain test emails containing codes.
Treat the local inbox as sensitive development state and do not publish its contents.

## Local rate-limit limitation and deferred acceptance

**CLI 2.122.0's built-in Mailpit path overrides `auth.rate_limit.email_sent = 2`
with an effective 360000/hour. Do not claim the configured 2/hour is enforced.**
This behavior was verified in the running container and pinned official CLI source.
The configured per-address 60-second resend protection was tested through the
actual endpoint. Request and verification limits are passed to Auth (30 per five
minutes per IP), but burst/exhaustion tests remain future ticket 02 security work.
An attempted explicit unauthenticated SMTP configuration was rejected because the
CLI requires SMTP user/password fields; it was reverted before further verification.
No fake SMTP credentials, external delivery, new mail service or custom limiter was
introduced. The user explicitly accepted this local-development exception after
review; it does not waive production authentication security requirements or
establish abuse-control acceptance. Production SMTP limits remain separate.

The ten-minute expiry is effective runtime configuration, not an elapsed-expiry
test. Incorrect/expired/reused-code behavior, rate-limit exhaustion, native session
protection, permission/RLS enforcement, revoked-token denial, foreground refresh,
lost-device behavior and local elapsed-inactivity expiry remain unverified.
Pro-only hosted 30-day inactivity configuration and verification remain explicitly
deferred. No custom timeout framework or fixed maximum lifetime was introduced.

No hosted project was created or linked; no paid services, real recipients,
external SMTP, production credentials or real care information were used. Hosting
remains $0/month. Root environment files, signing keys and node_modules plus
Supabase `.temp/` and `.branches/` are ignored. Images and the original project
volume are retained. After review, implement only the approved ticket 02 slice,
with actual backend boundary and native protection tests distinct from this smoke check.

## Official references

- [CLI installation and local workflow](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Supabase loopback network setup](https://supabase.com/docs/guides/local-development)
- [Configuration reference](https://supabase.com/docs/guides/local-development/cli/config)
- [Email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates)
- [Numeric email authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Pinned CLI SMTP and rate-limit behavior](https://github.com/supabase/cli/blob/v2.122.0/apps/cli/src/commands/start/services/gotrue.service.ts)
- [Docker Desktop port publishing](https://docs.docker.com/desktop/features/networking/)
- [Mailpit API](https://mailpit.axllent.org/docs/api-v1/)
