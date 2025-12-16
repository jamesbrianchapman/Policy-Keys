# Policy-Keys

Policy-Keys enables programmable policy keys for AI agents, enforcing controlled spending limits, API key usage, server access, read/write permissions, and custom rules—without custodizing master keys or secrets. It supports delegation of API keys, server credentials, and more, with built-in revocation and monitoring.

## Overview

Policy-Keys provides a secure system for issuing, validating, and managing policy-bound cryptographic keys. Key features include:
- **Programmable Constraints**: Define spending caps, time bounds, usage limits, and custom logic.
- **Hierarchical Keys**: Root keys derive child/agent keys with inherited or scoped policies.
- **Agent Integration**: Bind keys to AI agents for gated actions (e.g., swaps, transfers, approvals).
- **API & Server Management**: Delegate access to APIs, servers, or resources with restrictions.
- **Execution History**: Log and replay policy-gated actions with detailed audits.
- **Local Generation**: Keys are generated client-side using Web Crypto API for security.
- **No Custody**: Private keys remain on-device unless exported.

The project is a monorepo with a React-based client UI, Node.js server API, shared utilities, and build outputs. It uses Ethereum-compatible chains (e.g., Arbitrum) for on-chain interactions.

Supports actions like: swap, transfer, approve, stake, unstake, vote.

## Repository Layout

- `client/` — React frontend (UI for managing policies, agents, keys; uses Radix UI, React Router).
- `server/` — Node.js backend API (handles key issuance, validation, policy enforcement; endpoints like `/api/policies`, `/api/agents`, `/api/keys`, `/api/executions`).
- `shared/` — Shared types, utilities, and validation logic (e.g., key derivation paths, policy schemas).
- `dist/` — Build artifacts (compiled bundles; git-ignored during development).
- Root files:
  - `LICENSE-MIT-NC.txt` — MIT-like license for non-commercial use.
  - `LICENSE-Policy-Keys-COMMERCIAL.txt` — Terms for commercial usage.

## Requirements

- Node.js (LTS v18+ recommended; check `engines` in `package.json`).
- npm, yarn, or pnpm (repo uses pnpm workspaces).
- Git for cloning and development.
- Browser support: Modern browsers with Web Crypto API (e.g., Chrome, Firefox).
- Optional: Docker for containerized deployment; Ethereum wallet for key testing.

For development: Access to an Arbitrum RPC (default: public endpoint).

## Install & Run (Development)

This is a monorepo using pnpm workspaces. Install from root:

```
pnpm install
```

Run server:
```
cd server
pnpm dev  # or check server/package.json for scripts (e.g., dev, start)
```

Run client:
```
cd client
pnpm dev  # Starts React app (Vite or similar; proxies API to server)
```

To run both concurrently from root (if configured with tools like concurrently or turbo):
```
pnpm run dev:all
```

Access the UI at `http://localhost:3000` (adjust port as needed). The app includes routes for:
- `/policies`: Manage policies.
- `/agents`: Configure AI agents.
- `/keys`: Generate and view keys.
- `/history`: Execution logs.
- `/settings`: Theme, network, security prefs.

## Build & Run (Production)

Build client and server:
```
cd client && pnpm build  # Outputs to dist/ or build/
cd ../server && pnpm build  # If TypeScript, compiles to dist/
```

Deploy:
- **Client**: Static host (Vercel, Netlify, AWS S3). Serve the build folder.
- **Server**: Node.js platform (Heroku, AWS EC2, DigitalOcean). Use PM2 or Docker for production.
  - Docker example: `Dockerfile` in server/ for containerization.
- Ensure API endpoints are secured (e.g., auth middleware if added).

Example production run:
```
cd server/dist && node index.js
```

## Environment Variables

Create `.env` files in `client/` and `server/` (do not commit secrets). Key vars:

- **Server**:
  - `PORT`: Server port (default: 3000).
  - `DATABASE_URL`: Connection string (e.g., PostgreSQL for persistent storage).
  - `JWT_SECRET`: For signing/encrypting keys and sessions.
  - `CORS_ORIGINS`: Allowed client origins (e.g., http://localhost:3000).
  - `RPC_URL`: Blockchain RPC (default: https://arb1.arbitrum.io/rpc).
  - `CHAIN_ID`: Default chain (e.g., 42161 for Arbitrum).

- **Client**:
  - `VITE_API_URL`: Backend API base (default: /api).
  - `VITE_RPC_URL`: Client-side RPC for key gen/validation.

Check code for exact usage (e.g., `process.env` references). Use `.env.example` if present.

## Testing

Run tests per package:
```
cd server && pnpm test
cd ../client && pnpm test  # Likely uses Vitest/Jest for React components
```

Root workspace (if configured):
```
pnpm test
```

Add CI via GitHub Actions: Test on push/PR, lint with ESLint/Prettier.

## Contributing

We welcome contributions! Follow these steps:
1. Fork the repo.
2. Create a branch: `feat/your-feature` or `fix/issue-xxx`.
3. Install deps and run tests/linters: `pnpm lint` and `pnpm test`.
4. Make changes; add tests for new features (e.g., key gen, policy eval).
5. Commit with conventional commits (e.g., `feat: add policy binding`).
6. Submit PR with description; link issues.

Tips:
- Use `shared/` for cross-package logic (e.g., key fingerprints, CID utils).
- Document API endpoints in `server/` (e.g., via Swagger/OpenAPI).
- Add examples in `client/README.md` for UI components or SDK usage.
- Security: Focus on crypto best practices (e.g., no private key exposure).

If you'd like us to add this README via PR, let us know!

## Licensing

Dual-licensed:
- **Non-Commercial**: MIT-like (see `LICENSE-MIT-NC.txt` for terms; personal/educational use).
- **Commercial**: Paid terms (see `LICENSE-Policy-Keys-COMMERCIAL.txt`).

Review files for exact restrictions. Contact maintainer for enterprise licensing.

## Contact

Maintainer: jamesbrianchapman (repo owner).

Open GitHub Issues for bugs, features, or questions. Email iconoclastdao@gmail.com
