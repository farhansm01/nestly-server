# TASKS.md — nestly-server

> Aligned strictly with `info.md` API Integration Specifications.

## Phase 1 — Foundation & Auth Middleware
- [ ] T01: Connect MongoDB Atlas using non-SRV connection string in `src/lib/db.js`
- [ ] T02: Configure BetterAuth (`1.6.11`) in `src/lib/auth.js` + MongoDB adapter
- [ ] T03: Set up `jose-cjs` JWT verification against BetterAuth's JWKS endpoint
- [ ] T04: Middleware `src/middleware/auth.js`: Session/JWT verification for protected routes
- [ ] T05: Middleware `src/middleware/internalSecret.js`: `INTERNAL_API_SECRET` header bypass check
- [ ] T06: Set up `src/lib/gemini.js` — Gemini API client using `GEMINI_API_KEY`

## Phase 2 — Database Schemas & Models
- [ ] T07: `Property` model (`src/models/Property.js`) — title, type, price, formattedPrice, location, city, shortDesc, fullDesc, beds, baths, sqft, yearBuilt, image, gallery, amenities, sellerId, sellerName, status, views, rating
- [ ] T08: `Inquiry` model (`src/models/Inquiry.js`) — propertyId, propertyTitle, buyerId, name, email, phone, preferredDate, message, status
- [ ] T09: `Favorite` model (`src/models/Favorite.js`) — userId, propertyId

## Phase 3 — Property Listings API (`/api/properties`)
- [ ] T10: `GET /api/properties` — search, filter (`type`, `minPrice`, `maxPrice`, `beds`), sort, pagination
- [ ] T11: `GET /api/properties/:id` — single property details with seller info
- [ ] T12: `GET /api/properties/user/my` — logged-in user's own listings
- [ ] T13: `POST /api/properties` — create property listing (protected)
- [ ] T14: `PUT /api/properties/:id` — update property listing (protected, owner/admin)
- [ ] T15: `DELETE /api/properties/:id` — delete property listing (protected, owner/admin)

## Phase 4 — Inquiries & Favorites APIs
- [ ] T16: `POST /api/inquiries` — submit tour request / inquiry for a property
- [ ] T17: `GET /api/inquiries/my` — fetch inquiries for seller or buyer
- [ ] T18: `GET /api/favorites` — list saved properties for logged-in buyer
- [ ] T19: `POST /api/favorites/:propertyId` — save property to buyer's favorites
- [ ] T20: `DELETE /api/favorites/:propertyId` — remove property from favorites

## Phase 5 — AI Feature Routes (`/api/ai`)
- [ ] T21: `POST /api/ai/recommend` — submit preferences, return ranked property matches using Gemini
- [ ] T22: `POST /api/ai/lease-audit` — upload/submit lease document, return structured audit summary using Gemini
- [ ] T23: `POST /api/ai/chat` — conversational real estate assistant endpoint with property context using Gemini

## Phase 6 — Hardening & Error Handling
- [ ] T24: Input validation/sanitization across write endpoints
- [ ] T25: Global error handling middleware (`src/middleware/errorHandler.js`)
- [ ] T26: CORS configured for `CLIENT_URL` with credentials support

## Phase 7 — Deployment
- [ ] T27: Environment variables verified for Vercel deployment
- [ ] T28: Deploy and verify public server URL
