# ClockStore — React + Vite

A modern React conversion of the original vanilla HTML/CSS/JS ClockStore site. Same
design, same features, now built with React Router, Context-based state, and a fully
responsive mobile-first layout (320px and up).

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build      # production build to dist/
npm run preview     # preview the production build locally
```

## Project structure

```
src/
├── assets/            # images (background, product photos, logo)
├── components/        # reusable UI: Navbar, ProductCard, modals, Footer, etc.
├── context/            # AppContext — cart, auth, admin, products, notifications
├── data/               # sampleProducts catalog
├── hooks/              # useLocalStorage
├── pages/              # Home, Shop, Cart, Checkout, Confirmation
│   └── admin/          # Admin dashboard, products, add-product, orders, settings
├── App.jsx
├── main.jsx
└── index.css           # design tokens + shared utility classes
```

## Accounts (demo credentials, unchanged from the original site)

- **Customer login:** `demo@clockstore.com` / `demo123`
- **Admin login:** `admin@clockstore.com` / `admin123` (password can be changed from
  Admin → Settings; this now updates a real hashed password in MongoDB via the backend)

These accounts are created by running `npm run seed` in the `backend/` folder — see
the root `README.md` for full setup instructions.

## Data persistence

This app now talks to a real Express + MongoDB backend (see `../backend`). Products,
user accounts, and orders are stored in MongoDB and fetched via REST APIs
(`src/services/*.js`). The shopping cart still lives in `localStorage` for guests
(so you can add to cart without an account, exactly like before), and is additionally
synced to the server once you're logged in. Configure the API URL via `VITE_API_URL`
in `.env` (see `.env.example`).

The old hardcoded catalog in `src/data/products.js` is no longer used by the app; it's
kept only as a reference (the same catalog is re-created by `backend/seed/seedData.js`).

## Deploying to GitHub Pages

1. Update `vite.config.js` — set `base` to `/<your-repo-name>/`.
2. Add a deploy script is already included (`npm run deploy`, via the `gh-pages`
   package). Run:
   ```bash
   npm run build
   npm run deploy
   ```
3. In your repo settings, set GitHub Pages to serve from the `gh-pages` branch.

## Notes on the conversion

- All vanilla-JS DOM manipulation (`document.getElementById`, `innerHTML`,
  `classList.toggle`, etc.) was replaced with React state and props.
- The "pages" that used to be `<section style="display:none">` toggled by JS are now
  real routes via `react-router-dom`.
- **Bug fix:** in the original site, the navbar "Admin" button was hidden by default
  and only appeared *after* an admin was already logged in — there was no way to
  actually open the admin login modal from a fresh session. This is fixed: the Admin
  button now shows whenever no admin is currently logged in.
- Image loading failures fall back to a placeholder (`ProductImage` component),
  replacing the old `imgError()` function.
- Unused images from the original `img/` folder (not referenced by any product or the
  UI) were left out of the React build to keep the bundle hii lean.
