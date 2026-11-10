# ChainRestore

Multi-chain crypto incident documentation, blockchain security education, and recovery-guidance platform.

## Product areas
- Multi-chain incident intake and private case records
- Blockchain transaction tracing education and evidence preparation
- VIP security academy and learning resources
- Agent onboarding and case-handling guidance
- Facebook Ads learning resources
- TikTok Live creator workflow tutorials
- Support and account experience

## Supported networks
Bitcoin, Ethereum, BNB Chain, Solana, TRON, XRP Ledger, Polygon, Avalanche, and other networks where public data is available.

## Security principles
- Never request seed phrases, private keys, wallet passwords, or remote wallet access.
- Public transaction identifiers and wallet addresses are sufficient for public-chain research.
- Blockchain tracing does not guarantee asset recovery.
- Recovery outcomes depend on the facts, intermediaries, and applicable legal processes.

## Architecture
Static frontend files live in `public/`; serverless API routes live in `api/`; database migrations live in `migrations/`. The current runtime is Hatchable and API routes require its SDK.
