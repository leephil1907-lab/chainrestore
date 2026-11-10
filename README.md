# ChainRestore

Multi-chain blockchain incident documentation, transaction-tracing education and digital-asset security guidance.

## Product areas
- Recovery Centre for private incident records
- Blockchain tracing education and evidence preparation
- VIP Academy learning library
- Agent onboarding and case-handling guidance
- Facebook Ads learning resources
- TikTok Live creator workflow tutorials
- Member account and support information

## Runtime
ChainRestore runs as a standalone Node.js 22+ / Express application on Render. PostgreSQL is the durable database. Resend delivers email verification codes. Hatchable is not part of the runtime and no Hatchable SDK is imported.

## Local setup
1. Install Node.js 22+ and PostgreSQL.
2. Copy .env.example to .env and set DATABASE_URL, SESSION_SECRET, OTP_SECRET, RESEND_API_KEY and EMAIL_FROM.
3. Run npm install.
4. Run npm run migrate.
5. Run npm test and npm run check.
6. Run npm start.

## Render
render.yaml defines a Frankfurt web service and dedicated PostgreSQL database. The proposed configuration uses a paid Starter web service and Basic 256 MB PostgreSQL plan. Review the Blueprint and costs before applying it. Set the Resend API key and a verified sender address in the Render environment.

## Security
- One-time codes are random, short-lived, stored as keyed hashes and rate limited.
- Session tokens are random, stored as hashes and delivered in HttpOnly, Secure, SameSite cookies.
- PostgreSQL row-level security is enabled and forced on incident records; each query also filters by the authenticated owner.
- Date of birth is checked in the browser only and never sent to or stored by the server. This is a self-declared age gate, not identity-grade age verification.
- Never request seed phrases, private keys, wallet passwords, verification codes or remote wallet access.
- Blockchain tracing does not guarantee asset recovery.

## Data migration
The previous database contained zero incident reports and one verified test account. The test account is not being imported; new users will register through the standalone email-code flow.
