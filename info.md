# Nestly Server API Integration Specifications

> **Target Audience:** Backend Developers & AI Agents building the `nestly-server` repository.  
> **Frontend Repo:** `nestly-client` (Next.js App Router, JavaScript, Tailwind CSS + DaisyUI)  
> **MongoDB Database Name:** `nestify`

---

## 1. Executive Summary & Architecture

The `nestly-client` frontend communicates with the `nestly-server` backend via RESTful HTTP API calls formatted as JSON. The frontend is built strictly following the resource separation pattern:

- **Data Fetching (GET):** `src/api/<resource>.js`
- **Data Mutations (POST / PUT / DELETE):** `src/actions/<resource>.js`
- **Centralized Fetch Wrapper:** `src/lib/fetcher.js` (prepends `NEXT_PUBLIC_BASE_URL` or `NEXT_PUBLIC_SERVER_URL` and passes authentication headers).

---

## 2. Authentication & User Roles

- **Framework:** BetterAuth (`1.6.11`)
- **Database Adapter:** MongoDB Adapter targeting `nestify` database.
- **Collections:** `user`, `session`, `account`, `verification`
- **User Roles:**
  - `user` / `buyer` — Default role upon registration.
  - `seller` / `agent` — Can create and manage property listings.
  - `admin` — Super Admin with system-wide moderation access.

---

## 3. Required Server API Routes & Endpoints

To support all frontend pages, features, and dashboards, the `nestly-server` must implement the following REST endpoints:

### 🏡 A. Property Listings API (`/api/properties`)

#### 1. `GET /api/properties`
Fetch all active properties with support for filtering, searching, sorting, and pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `search` | string | `""` | Search query matching title, location, or description |
| `type` | string | `""` | Filter by type (`apartment`, `villa`, `penthouse`, `suburban`) |
| `minPrice` | number | `0` | Minimum price filter |
| `maxPrice` | number | `Infinity` | Maximum price filter |
| `beds` | number | `0` | Minimum bedroom count |
| `sort` | string | `"newest"` | Sorting order (`newest`, `price-asc`, `price-desc`, `rating`) |
| `page` | number | `1` | Page index |
| `limit` | number | `12` | Items per page |

**Response Format (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "title": "Skyline Luxury Penthouse",
      "type": "penthouse",
      "price": 2450000,
      "formattedPrice": "$2,450,000",
      "location": "742 Evergreen Terrace, San Francisco, CA",
      "city": "San Francisco",
      "shortDesc": "Modern skyline views with floor-to-ceiling glass and private elevator access.",
      "fullDesc": "Detailed multi-paragraph description...",
      "beds": 3,
      "baths": 3,
      "sqft": "2,850 sqft",
      "yearBuilt": "2024",
      "image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
      "amenities": ["Private Swimming Pool", "24/7 Security", "Private Balcony"],
      "sellerId": "user_id_here",
      "sellerName": "Farhan Sadiq",
      "status": "Active",
      "views": 482,
      "rating": 4.9,
      "createdAt": "2026-07-19T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 120,
    "page": 1,
    "limit": 12,
    "totalPages": 10
  }
}
```

---

#### 2. `GET /api/properties/:id`
Fetch detailed information for a single property listing by ID.

**Response Format (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "title": "Skyline Luxury Penthouse",
    "type": "penthouse",
    "price": 2450000,
    "formattedPrice": "$2,450,000",
    "location": "742 Evergreen Terrace, San Francisco, CA",
    "shortDesc": "Modern skyline views...",
    "fullDesc": "Complete property overview...",
    "beds": 3,
    "baths": 3,
    "sqft": "2,850 sqft",
    "yearBuilt": "2024",
    "image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
    "gallery": [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227"
    ],
    "amenities": ["Private Swimming Pool", "24/7 Security"],
    "seller": {
      "id": "user_id_here",
      "name": "Farhan Sadiq",
      "email": "farhan@example.com",
      "phone": "+1 (555) 234-5678"
    },
    "status": "Active",
    "createdAt": "2026-07-19T10:00:00.000Z"
  }
}
```

---

#### 3. `GET /api/properties/user/my`
Fetch properties created by the currently logged-in seller or user (requires authentication header/cookie).

**Response Format (`200 OK`):** Array of property objects owned by the authenticated user.

---

#### 4. `POST /api/properties`
Create a new property listing (Called from `/dashboard/add`).

**Request Body (`application/json`):**
```json
{
  "title": "Emerald Bay Coastal Villa",
  "type": "villa",
  "price": 4800000,
  "location": "Malibu Beach, CA",
  "shortDesc": "Oceanfront villa with private beach path.",
  "fullDesc": "Expansive coastal estate featuring open-concept living...",
  "beds": 5,
  "baths": 4.5,
  "sqft": "4,500 sqft",
  "yearBuilt": "2023",
  "image": "https://images.unsplash.com/photo-1613977257363-707ba9348227",
  "amenities": ["Private Swimming Pool", "Panoramic Ocean View", "Garage / Parking"]
}
```

**Response Format (`201 Created`):**
```json
{
  "success": true,
  "message": "Property listing created successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "title": "Emerald Bay Coastal Villa",
    "status": "Active",
    "createdAt": "2026-07-19T12:00:00.000Z"
  }
}
```

---

#### 5. `PUT /api/properties/:id`
Update an existing property listing (Called from `/dashboard/manage` edit modal).

**Request Body (`application/json`):** Any modified property fields (`title`, `price`, `location`, `status`, etc.).

---

#### 6. `DELETE /api/properties/:id`
Delete a property listing by ID (Called from `/dashboard/manage` delete action).

**Response Format (`200 OK`):**
```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

---

### 📩 B. Inquiries & Tour Requests API (`/api/inquiries`)

#### 1. `POST /api/inquiries`
Submit a tour request or buyer inquiry for a property.

**Request Body (`application/json`):**
```json
{
  "propertyId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "propertyTitle": "Skyline Luxury Penthouse",
  "name": "Jane Buyer",
  "email": "jane@example.com",
  "phone": "+1 (555) 987-6543",
  "preferredDate": "2026-07-25",
  "message": "I would like to schedule a private tour this Saturday."
}
```

#### 2. `GET /api/inquiries/my`
Fetch inquiries received by a seller or submitted by a buyer for display in `/dashboard/buyer` and `/dashboard/seller`.

---

### ❤️ C. Favorites / Saved Homes API (`/api/favorites`)

- `GET /api/favorites` — List saved properties for the logged-in buyer.
- `POST /api/favorites/:propertyId` — Add property to buyer's saved shortlist.
- `DELETE /api/favorites/:propertyId` — Remove property from saved shortlist.

---

### 🤖 D. AI Engine Endpoints (`/api/ai`)

- `POST /api/ai/recommend` — Accepts user preferences (budget, location, house type) and returns ranked property IDs.
- `POST /api/ai/lease-audit` — Accepts document text / lease PDF upload and returns key terms, monthly obligations, and risk flags summary.
- `POST /api/ai/chat` — Real estate AI assistant prompt & response API.

---

## 4. Recommended MongoDB Collection Schemas

### Collection: `properties`
```json
{
  "_id": "ObjectId",
  "title": "String (required)",
  "type": "String (enum: apartment, villa, penthouse, suburban)",
  "price": "Number (required)",
  "formattedPrice": "String",
  "location": "String (required)",
  "city": "String",
  "shortDesc": "String (required)",
  "fullDesc": "String",
  "beds": "Number",
  "baths": "Number",
  "sqft": "String",
  "yearBuilt": "String",
  "image": "String (URL)",
  "gallery": ["String (URL)"],
  "amenities": ["String"],
  "sellerId": "ObjectId (ref: user)",
  "sellerName": "String",
  "status": "String (default: Active)",
  "views": "Number (default: 0)",
  "rating": "Number (default: 5.0)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Collection: `inquiries`
```json
{
  "_id": "ObjectId",
  "propertyId": "ObjectId (ref: properties)",
  "propertyTitle": "String",
  "buyerId": "ObjectId (ref: user)",
  "name": "String",
  "email": "String",
  "phone": "String",
  "preferredDate": "String",
  "message": "String",
  "status": "String (Pending / Responded / Closed)",
  "createdAt": "Date"
}
```

---

## 5. Environment Variables Setup for `nestly-server`

Create a `.env` file in the root of `nestly-server` with:

```env
PORT=5000
MONGODB_URI=mongodb://hireloop:B2fA3CCddQHtMAYc@ac-1hdmimo-shard-00-00.7st6wsv.mongodb.net:27017,ac-1hdmimo-shard-00-01.7st6wsv.mongodb.net:27017,ac-1hdmimo-shard-00-02.7st6wsv.mongodb.net:27017/nestify?ssl=true&replicaSet=atlas-6l031q-shard-0&authSource=admin&appName=farhansm01
BETTER_AUTH_SECRET=hP5skfl0gNF5U6Hg0uZLGJXGeDYdDfFi
BETTER_AUTH_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=1011658749003-p3n1be83pb2n15jgm957ulhdf73
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 6. CORS & Headers Policy

Ensure `nestly-server` allows requests from the frontend client origin (`http://localhost:3000` or production Vercel URL):

- **Allowed Headers:** `Content-Type`, `Authorization`
- **Credentials:** `credentials: true` (for cookie session handling)
