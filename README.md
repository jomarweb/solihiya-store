# Solihiya: furniture store demo

A working e-commerce demo: catalog with filters and search, product pages, cart,
customer accounts and a mock checkout (orders are saved, no payment is taken).

- Frontend: React 19 + Vite, React Router
- Backend: Supabase (Postgres, Auth, row-level security). The schema, security
  rules, order function and catalog are in `supabase/schema.sql`.
- Hosting: nginx on a DigitalOcean droplet, set up by `deploy/setup.sh`.

## Run locally

    npm install
    npm run dev

`.env.production` holds the Supabase URL and publishable key (safe to expose:
every table is protected by row-level security). Copy it to `.env.local` for dev.

## How orders work

Checkout calls the `place_order` Postgres function. It reads prices from the
database (never the browser), locks the product rows, checks stock, writes the
order and its line items, and decrements stock in one transaction. Customers can
only read their own orders.
