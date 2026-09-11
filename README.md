# Metallic Crafts (ClockStore) — MERN Stack

This project was converted from a frontend-only React app (localStorage-backed) into
a full MERN stack application: **MongoDB, Express, React, Node.js**. The existing UI,
layout, styling, routing, and features were preserved exactly — only the data layer
changed, from `localStorage` to a real backend + database.

```
Metallic Crafts/
├── frontend/     React + Vite app (unchanged UI, now talks to the backend API)
├── backend/      Express + MongoDB API
└── README.md     (this file)
```

---

## 1. What changed (summary)

| Area | Before | After |
|---|---|---|
| Products | Hardcoded in `src/data/products.js` | MongoDB `Product` collection, served via `/api/products` |
| Customer accounts | One hardcoded demo login | Real registration/login, bcrypt-hashed passwords, JWT |
| Admin account | Hardcoded email + plaintext password in `localStorage` | Real admin user (role: `admin`) in MongoDB, JWT-protected |
| Cart | `localStorage` only | Still `localStorage`-first for guests (unchanged UX); additionally synced to MongoDB per logged-in user |
| Orders | `localStorage` array | MongoDB `Order` collection; prices re-validated server-side at checkout |
| Admin CRUD (products) | Local state only | Real REST endpoints, JWT + admin-role protected |

Nothing about the **look, layout, CSS, routing, or component structure** was changed
except where strictly required to call the API instead of `localStorage` (all such
changes are documented inline as code comments, and summarized in section 6 below).

### Responsive design note

This project's CSS was already built with careful, comprehensive responsive design —
mobile-first breakpoints from 320px up through 1920px+, fluid `clamp()`-based
typography/spacing, a working hamburger nav, a horizontally-scrollable admin table on
small screens, and touch-device hover fallbacks. I reviewed every stylesheet
(`index.css` and each component/page `.css` file) and confirmed this coverage is
genuinely solid across phones, tablets, laptops, and large desktops — no changes were
needed there. (One pre-existing, unused, byte-for-byte duplicate file,
`src/components/Shop.css`, is dead code left over from before the app was organized
into `pages/` — it's not imported anywhere, so it has zero effect on the app; left in
place rather than deleted, per "don't remove things unnecessarily.")

---

## 2. Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** — either:
  - a local install (`mongod` running on `mongodb://127.0.0.1:27017`), or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (recommended if you
    don't want to install MongoDB locally)

---

## 3. Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```
MONGO_URI=mongodb://127.0.0.1:27017/metallic-crafts
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

(If you're using Atlas, replace `MONGO_URI` with your Atlas connection string.)

Seed the database with the original product catalog + demo accounts:

```bash
npm run seed
```

You should see output ending in `🌱 Seeding complete.` This creates:
- The same 8 products that used to be hardcoded in the frontend
- Demo customer: `demo@clockstore.com` / `demo123`
- Demo admin: `admin@clockstore.com` / `admin123`

Start the backend:

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected: <host>/metallic-crafts
🚀 Server running on http://localhost:5000
```

### Frontend

In a **second terminal**:

```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env` should contain:
```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

---

## 4. Testing

### 4.1 Manual testing checklist (in the running app)

1. **Home page** loads and shows the 8 seeded products (confirms `GET /api/products` works).
2. **Sign up** a new customer account -> should log you in immediately.
3. **Log out**, then **log in** with `demo@clockstore.com` / `demo123`.
4. **Add items to cart** as a guest (logged out) -> works via `localStorage`, same as before.
5. **Add items to cart while logged in** -> open dev tools -> Application -> Local
   Storage to confirm `cart` is set; refresh the page, cart should persist.
6. **Checkout** -> fill the shipping form -> place order -> should land on the
   Confirmation page with an order ID and amount.
7. **Admin login** (`admin@clockstore.com` / `admin123`) via the "Admin" button.
8. **Admin -> Add Product** -> upload an image, fill the form, submit -> should appear
   in the Shop/Home pages immediately (re-fetch or check Admin -> Products).
9. **Admin -> Products** -> delete a product -> confirm it disappears everywhere.
10. **Admin -> Orders** -> confirm the order placed in step 6 appears here.
11. **Admin -> Settings** -> change admin password -> log out -> log back in with the
    new password to confirm it took effect.

### 4.2 API testing with Postman / curl

Base URL: `http://localhost:5000/api`

**Register**
```
POST /auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```
-> `201`, `{ success: true, data: { user, token } }`

**Login**
```
POST /auth/login
{ "email": "demo@clockstore.com", "password": "demo123" }
```
-> `200`, `{ success: true, data: { user, token } }`

**Get current user** (replace `<TOKEN>` with the token from login)
```
GET /auth/me
Authorization: Bearer <TOKEN>
```

**Admin login**
```
POST /auth/admin/login
{ "email": "admin@clockstore.com", "password": "admin123" }
```

**List products**
```
GET /products
GET /products?type=wall&sort=price_low
```

**Create product** (admin token required)
```
POST /products
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "Test Clock",
  "brand": "TestBrand",
  "type": "wall",
  "price": 29.99,
  "originalPrice": 39.99,
  "stock": 5,
  "image": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Delete product** (admin token required)
```
DELETE /products/<PRODUCT_ID>
Authorization: Bearer <ADMIN_TOKEN>
```

**Place an order** (customer token required)
```
POST /orders
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "items": [ { "productId": "<PRODUCT_ID>", "quantity": 2 } ],
  "shippingAddress": {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "555-1234",
    "city": "Springfield",
    "address": "123 Main St",
    "postalCode": "00000",
    "country": "USA"
  },
  "paymentMethod": "cod"
}
```

**Get my orders**
```
GET /orders/me
Authorization: Bearer <TOKEN>
```

**Get all orders (admin)**
```
GET /orders
Authorization: Bearer <ADMIN_TOKEN>
```

**Error response example** (bad login):
```json
{ "success": false, "message": "Invalid email or password" }
```
-> HTTP `401`

### 4.3 What I verified myself, and what you should verify

I ran `npm install`, syntax-checked every backend file, and boot-tested the server —
it starts cleanly, loads every route/middleware without import errors, and its
MongoDB-connection error handling works correctly (confirmed by pointing it at an
unreachable database and seeing a clean error + graceful exit, rather than a crash).
I also built the frontend (`npm run build`) successfully after every integration
change. **I was not able to run the app against a live MongoDB instance** in the
environment I built this in (no outbound network access to install/download MongoDB
there) — so please run through section 4.1 and 4.2 yourself once you have MongoDB
running, to confirm actual end-to-end behavior (data really persisting, JWTs really
validating, etc.).

---

## 5. Running the project (quick reference)

```bash
# Terminal 1 - backend
cd backend
npm install
npm run seed        # first time only (or after npm run seed:destroy)
npm run dev

# Terminal 2 - frontend
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000` (health check: `GET /api/health`)

---

## 6. Final review notes

- **No missing imports**: both `frontend` and `backend` build/boot cleanly from a
  fresh `npm install`.
- **Route/API alignment**: every context function (`login`, `signup`, `adminLogin`,
  `addProduct`, `deleteProduct`, `placeOrder`, cart sync, etc.) maps to a real,
  matching backend route; verified by re-reading each controller against each
  frontend service call.
- **CORS**: configured via `CORS_ORIGIN` in `backend/.env`, defaults to the Vite dev
  server's origin (`http://localhost:5173`). Update this if you deploy the frontend
  elsewhere.
- **MongoDB connection issues**: handled centrally in `backend/config/db.js` — a bad
  `MONGO_URI` produces a clear console error and a non-zero exit, rather than the
  server silently half-starting.
- **Auth**: passwords are always hashed with bcrypt before being stored; the `User`
  model's `toJSON` transform strips the password hash from any response, and
  `.select("+password")` is only used internally for login comparisons.
- **Responsive design**: reviewed in detail — see the note in section 1.
- **Unused dependencies**: none added beyond what's needed (`axios` on the frontend;
  `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, `morgan`,
  `express-async-handler` on the backend).
- **Broken existing features**: none identified. The few UI-visible changes are:
  - Login/Signup/Admin-login/Checkout/Add-product buttons now show a brief
    "loading" label while their (now network) request is in flight.
  - The Shop page's "Newest" sort no longer subtracts numeric IDs (which would
    break with MongoDB's string IDs) — it now relies on the API already returning
    products newest-first, which is equivalent.
  - Settings -> Import now recreates products via the API one at a time (and
    explicitly does not re-import raw order records, since orders should come from
    real checkouts tied to real user accounts, not be fabricated from a JSON file).
  - Dashboard's "stored locally in your browser" tip text was corrected to mention
    MongoDB, since it's no longer accurate.

## 7. Known limitations / things you may want next

- Product "Edit" in the admin Products table is still a stub (shows a "coming soon"
  notification) — this was already the case in the original frontend-only version;
  a real edit form would reuse `PUT /api/products/:id`, which is already implemented
  on the backend and just needs a frontend form wired to it.
- There's no dedicated "My Orders" page for customers (the original design only
  showed orders in the admin panel) — the backend already exposes `GET /api/orders/me`
  if you'd like to add one later.
- Stripe payment is still a disabled placeholder in Checkout, matching the original
  design's "Coming Soon" state.
