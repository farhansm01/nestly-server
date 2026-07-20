# AGENTS.md — nestly-server

## Project Overview
**Nestly** — an AI-powered real estate / property listing platform.
This repo is the **backend only**. It is deployed independently to Vercel
and exposes a public API URL that `nestly-client` calls.

## Tech Stack
- **Framework:** Express, **JavaScript** (not TypeScript)
- **Database:** MongoDB Atlas — **non-SRV connection string** (ISP blocks
  SRV DNS, always use the standard `mongodb://` form with explicit hosts)
- **Auth:** BetterAuth, pinned to `1.6.11` exactly (no caret), install
  with `--legacy-peer-deps`
- **AI provider:** Gemini API (Google AI) — used for all 3 AI features
- **Deployment:** Vercel

## Repo Relationship
- This server has no knowledge of the client's UI — it only returns data/JSON.
- All routes are registered in **`index.js`** — this is the single source
  of truth for what endpoints exist. Keep route handlers thin; real logic
  lives in `controllers/` or `services/`.
- Server-to-server or server-component-to-server calls from the client
  use an `INTERNAL_API_SECRET` header bypass (same pattern as the previous
  project) — regular browser requests go through normal BetterAuth session/JWT checks.

## Auth Flow
- BetterAuth issues sessions; JWTs are verified using `jose-cjs` with
  `createRemoteJWKSet` against BetterAuth's JWKS endpoint — do not
  reinvent JWT verification manually.
- Google social login must be configured as a BetterAuth provider.

## File Structure Convention
```
index.js                 → all routes registered here
src/
  routes/
    properties.js
    auth.js
    ai.js
  controllers/
    properties.js         → GET/POST/PUT/DELETE handlers, call services
  services/
    ai/
      recommendation.js    → Gemini call for property recommendations
      documentIntel.js     → Gemini call for lease/document summarization
      chatAssistant.js     → Gemini call for conversational assistant
  models/
    Property.js
    User.js
  middleware/
    auth.js                → session/JWT verification
    internalSecret.js      → INTERNAL_API_SECRET bypass check
  lib/
    db.js                  → MongoDB connection (non-SRV)
    gemini.js               → Gemini client setup
```

## AI Features — Backend Responsibilities
1. **Smart Recommendation Engine** — endpoint(s) to submit user
   preferences/interactions, return ranked property matches, and update
   the user's inferred preferences as they save/view/dismiss listings.
2. **AI Document Intelligence** — endpoint to accept an uploaded lease/
   agreement (PDF), send to Gemini, return a structured summary
   (key terms, flagged clauses, action items).
3. **AI Chat Assistant** — endpoint(s) supporting conversation history,
   context about the current property/listing being viewed, and
   (recommended) streaming responses.

## Coding Conventions
- Express server runs on port 5000 locally
- Keep AI provider calls isolated in `services/ai/` — routes/controllers
  should never call Gemini directly
- Validate and sanitize all user input, especially on the auth and
  add-property endpoints
- No placeholder/mock data in production endpoints

## Communication Style for Agents Working on This Repo
- Keep explanations simple, avoid dense jargon
- Full file replacements preferred over partial diffs
- Include a commit message with every change, unprompted
- Flag unclear requirements instead of silently guessing
