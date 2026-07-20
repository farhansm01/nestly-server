<h1 align="center">
  <img src="https://img.shields.io/badge/Nestly-API%20Server-10b981?style=for-the-badge&logo=node.js&logoColor=white" alt="Nestly Server"/>
  <br/>
  Nestly — Server
</h1>

<p align="center">
  <strong>Express REST API · MongoDB · Google Gemini AI · BetterAuth · Vercel Serverless</strong>
  <br/>
  <br/>
  <a href="https://nestly-server-sigma.vercel.app">🌐 Live API</a> ·
  <a href="https://github.com/farhansm01/nestly-client">🔗 Frontend Repo</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?logo=express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb" />
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel" />
</p>

---

## 📖 Overview

**Nestly Server** is the backend REST API powering the Nestly AI real estate platform. Built with **Node.js + Express**, it handles property listings, user management, admin governance, favorites, inquiries, and a full **Google Gemini AI Intelligence Suite** — all deployed as serverless functions on Vercel, backed by **MongoDB Atlas**.

---

## ✨ API Features

### 🏠 Property Management API
- Full CRUD for property listings (title, type, price, location, beds, baths, sqft, amenities, gallery)
- Property type categories: `apartment`, `villa`, `penthouse`, `suburban`
- Admin approval workflow: `Pending → Approved / Rejected`
- View counter per property
- Image gallery sync (supports `image`, `gallery`, and `images` fields)
- Filter by type, status, search query, sort order

### 🤖 Google Gemini AI Intelligence Suite
| Endpoint | Description |
|---|---|
| `POST /api/ai/recommend` | Generates lifestyle-matched property recommendations with 88–99% Gemini match scores, custom highlight reasons, and badge labels |
| `POST /api/ai/lease-audit` | Audits lease/purchase agreement text — detects risk clauses, extracts prices, classifies document type, generates action items |
| `POST /api/ai/chat` | Conversational real estate assistant with full MongoDB property catalog context and Nestly platform workflow knowledge |

### 👥 User Administration
- List all registered users with search, role, and status filters
- Update user status (`active` / `restricted`)
- Change user role (`user` / `admin`)
- Delete user accounts
- Platform stats: total users, total properties, pending approvals, active listings

### ❤️ Favorites & Inquiries
- Save / unsave properties per user
- Buyer-to-seller inquiry system

### 🔐 Authentication & Security
- **BetterAuth** integration for session validation
- Internal API Secret header validation (`x-internal-secret` / `INTERNAL_API_SECRET`) for service-to-service security
- Admin role middleware protecting all admin routes
- CORS with `credentials: true` for cross-origin cookie sessions

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js 18+** | JavaScript runtime |
| **Express 4** | REST API framework |
| **MongoDB Atlas** | Cloud database |
| **Mongoose** | MongoDB ODM |
| **Google Gemini AI** (`@google/genai`) | AI recommendations, document analysis, chat |
| **BetterAuth** | User authentication and session management |
| **Vercel Serverless** | Hosting & deployment |
| **cors** | Cross-origin resource sharing |
| **dotenv** | Environment variable management |

---

## 🗂 Project Structure

```
nestly-server/
├── index.js                    # Express app entry point, CORS, middleware, route mounting
├── vercel.json                 # Vercel serverless function configuration
├── src/
│   ├── routes/
│   │   ├── properties.js       # Property CRUD routes
│   │   ├── admin.js            # Admin stats, user management routes
│   │   ├── ai.js               # AI feature routes (recommend, audit, chat)
│   │   ├── favorites.js        # Favorites routes
│   │   └── inquiries.js        # Inquiry routes
│   ├── controllers/            # Route handler logic
│   ├── models/
│   │   ├── Property.js         # Mongoose Property schema
│   │   ├── Favorite.js         # Mongoose Favorite schema
│   │   └── Inquiry.js          # Mongoose Inquiry schema
│   ├── middleware/
│   │   └── adminAuth.js        # Admin role verification middleware
│   ├── services/
│   │   └── ai/
│   │       ├── chatAssistant.js    # Gemini chat with live property catalog context
│   │       ├── recommendation.js   # Multi-attribute luxury scoring engine
│   │       └── documentIntel.js    # Lease audit & risk clause detection
│   └── lib/
│       └── db.js               # MongoDB Atlas connection setup
├── .env                        # Environment variables (not committed)
└── package.json
```

---

## 📡 API Reference

### Properties

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/properties` | List all approved properties (search, filter, sort) | Public |
| `GET` | `/api/properties/:id` | Get single property detail | Public |
| `POST` | `/api/properties` | Create new property listing | Session |
| `PATCH` | `/api/properties/:id` | Update property | Session (owner/admin) |
| `DELETE` | `/api/properties/:id` | Delete property | Session (owner/admin) |
| `PATCH` | `/api/properties/:id/status` | Update approval status | Admin |
| `GET` | `/api/properties/user/my` | Get current user's listings | Session |
| `GET` | `/api/properties/admin/all` | Get all listings (admin view) | Admin |

### Admin

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Platform stats overview | Admin |
| `GET` | `/api/admin/users` | List all users | Admin |
| `PATCH` | `/api/admin/users/:id/status` | Update user status | Admin |
| `PATCH` | `/api/admin/users/:id/role` | Update user role | Admin |
| `DELETE` | `/api/admin/users/:id` | Delete user account | Admin |

### AI Intelligence Suite

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/ai/recommend` | Get lifestyle-matched property recommendations | Internal Secret |
| `POST` | `/api/ai/lease-audit` | Audit document text for risk clauses | Internal Secret |
| `POST` | `/api/ai/chat` | Chat with Nestly AI real estate assistant | Internal Secret |

### Favorites & Inquiries

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/favorites` | Get user's saved properties | Session |
| `POST` | `/api/favorites` | Save a property | Session |
| `DELETE` | `/api/favorites/:id` | Remove from saved | Session |
| `GET` | `/api/inquiries` | List inquiries | Session |
| `POST` | `/api/inquiries` | Submit inquiry | Session |

---

## ⚙️ Environment Variables

Create a `.env` file in the root:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/nestly

# BetterAuth
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Security
INTERNAL_API_SECRET=your_internal_secret

# Frontend Origins (CORS)
ALLOWED_ORIGIN=http://localhost:3000
```

> **For Vercel production**, set `BETTER_AUTH_URL` and `ALLOWED_ORIGIN` to your live frontend URL (e.g. `https://nestly-client-silk.vercel.app`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Cloud project with Gemini API enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/farhansm01/nestly-server.git
cd nestly-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

Server starts at **[http://localhost:5000](http://localhost:5000)**.

---

## 🌐 Deployment

Deployed on **Vercel** as a serverless Node.js function via `vercel.json`:

```json
{
  "version": 2,
  "builds": [{ "src": "index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "index.js" }]
}
```

**Live API URL:** [https://nestly-server-sigma.vercel.app](https://nestly-server-sigma.vercel.app)

### Vercel Environment Variables Required:

| Variable | Value |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `BETTER_AUTH_SECRET` | Your BetterAuth secret |
| `BETTER_AUTH_URL` | `https://nestly-client-silk.vercel.app` |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `INTERNAL_API_SECRET` | Shared internal secret with frontend |
| `ALLOWED_ORIGIN` | `https://nestly-client-silk.vercel.app` |

---

## 🔗 Related

- **Frontend Repo:** [nestly-client](https://github.com/farhansm01/nestly-client)
- **Live Frontend:** [https://nestly-client-silk.vercel.app](https://nestly-client-silk.vercel.app)

---

## 📄 License

MIT License — © 2026 Farhan Sadiq
