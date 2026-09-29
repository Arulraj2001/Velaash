# Velaash (VELAASH TRADER'S) — E-Commerce Platform

A production-grade Next.js e-commerce architecture for **Velaash** (Legal entity: **VELAASH TRADER'S**), an exclusive Indian luxury clothing boutique celebrating timeless craftsmanship, royal silhouettes, and modern artistry.

---

## 💎 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) in Strict Mode
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with semantic theme tokens
- **Backend / Database**: [Supabase](https://supabase.com/) (`@supabase/ssr`) with separate browser, server, and middleware clients
- **Schema Validation**: [Zod](https://zod.dev/)
- **Type-safe Env**: [@t3-oss/env-nextjs](https://env.t3.gg/)
- **Code Quality**: [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

---

## 🎨 Design System

All visual tokens are defined in [`tailwind.config.ts`](./tailwind.config.ts) and [`app/globals.css`](./app/globals.css):

### Color Tokens

- **Primary Gold**: `#F2A900` (`brand.gold`) — Primary CTA buttons, active accents, focus rings.
- **Deep Accent Gold/Brown**: `#CC6F00` (`brand.accent`) — Secondary highlights, boutique tags, hover states.
- **Dark Brand Brown**: `#4D2A00` (`brand.dark`) — Headings, body typography, dark surfaces, luxury footer.
- **Light Gold Background**: `#F9E6A8` (`brand.light`) — Soft card backgrounds, highlight chips, subtle borders.
- **Near-White Cream Base**: `#FFFBF0` (`brand.cream`) — Default page background providing a serene luxury ambiance.
- **Off-White / Surface**: `#FFFFFF` (`brand.card`) — Clean, elevated card backgrounds.

### Typography

- **Heading / Display**: `Cormorant Garamond` (Google Font via `next/font/google`), capturing Indian boutique heritage.
- **Body / Interface**: `Plus Jakarta Sans` (Google Font via `next/font/google`), clean, crisp, and accessible.

### Reusable UI Primitives (`@/components/ui`)

- `Button` (`primary`, `secondary`, `dark`, `outline`, `ghost`, `link` variants, loading spinner, left/right icon slots)
- `Input` (floating labels, left/right icons, helper text, accessible ARIA error states)
- `Card` (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, hover elevation)
- `Badge` (`default`, `accent`, `subtle`, `outline`, `dark` variants, size variants, icon slots)
- `Container` (responsive centered container: `sm`, `md`, `lg`, `xl`, `full`)
- `Section` (semantic section with vertical rhythm: `sm`, `md`, `lg`, `xl`, and boutique backgrounds)

---

## 📁 Feature-Based Project Structure

This project follows a **domain-driven, feature-based** structure rather than a type-based structure:

```text
velaash/
├── app/                        # Next.js App Router (pages, layouts, route handlers)
│   ├── globals.css             # Theme definitions and base styles
│   ├── layout.tsx              # Root layout with fonts, Header, and Footer
│   └── page.tsx                # Design system verification showcase
├── components/
│   ├── layout/                 # Layout components (Header, Footer)
│   └── ui/                     # Shared UI primitives (Button, Input, Card, Badge, etc.)
├── features/                   # Domain features (self-contained modules)
│   ├── products/               # Catalog, variants (size/color/sku), filters
│   │   ├── actions/            # Server actions
│   │   ├── components/         # Domain-specific components
│   │   ├── queries/            # Database queries
│   │   └── types/              # Domain types and Zod schemas
│   ├── cart/                   # Cart state, drawer, pricing calculations
│   ├── orders/                 # Checkout, order tracking, Indian address schemas
│   ├── auth/                   # Supabase authentication and user profiles
│   ├── admin/                  # Dashboard metrics, catalog and order management
│   └── reviews/                # Verified buyer reviews and ratings
├── lib/
│   ├── supabase/               # Supabase SSR clients (browser, server, middleware)
│   │   ├── client.ts           # Browser client (`createBrowserClient`)
│   │   ├── server.ts           # Server client (`createServerClient` + cookies)
│   │   └── middleware.ts       # Session refresh helper
│   ├── env.ts                  # Type-safe environment validation (@t3-oss/env-nextjs)
│   ├── constants.ts            # Brand constants (legal name: VELAASH TRADER'S)
│   └── utils.ts                # Utilities (`cn`, `formatCurrencyINR`)
├── styles/                     # Supplementary stylesheets
├── types/                      # Global shared types and Supabase database definitions
├── middleware.ts               # Next.js root middleware invoking Supabase session refresh
├── tailwind.config.ts          # Tailwind theme tokens and fonts
└── tsconfig.json               # TypeScript strict configuration with `@/*` aliases
```

---

## ⚡ Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

> **Note for Windows Users**: This project uses `node-linker=hoisted` in [`.npmrc`](./.npmrc) for optimal NTFS performance and compatibility with Next.js Turbopack.

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the design system showcase.

---

## 🔐 Authentication Architecture

Velaash implements a strict separation between **Customer Authentication** and **Admin Authentication**:

### 1. Customer Authentication (`/account/login`)

- **Passwordless OTP + Google OAuth**: Built for an Instagram/WhatsApp-driven luxury customer base. Shoppers receive a 6-digit OTP code directly in their inbox or authenticate with Google in one tap. No forgotten passwords or friction.
- **Guest Checkout Unlocked**: Shoppers can browse the entire collection, add couture items to the bag, and complete checkout without ever being forced to register. Login is required exclusively to access the **Patron Sanctuary** (`/account/*`) to view order stitching timelines, manage saved shipping addresses, or maintain personal wishlists.
- **Automatic Customer Provisioning**: Successful sign-up seamlessly provisions or updates a corresponding record in the Postgres `customers` table with their full name and contact information.
- **Protected Customer Routes**: `/account/*` routes are protected by Next.js middleware, automatically redirecting unauthenticated visitors to `/account/login?returnUrl=...`.

### 2. Admin Authentication (`/admin/login`)

- **Separate, Undiscoverable Gate**: Located strictly at `/admin/login` with `noindex, nofollow` robot directives and completely absent from all public headers, footers, and sitemaps.
- **Email + Master Password**: Admin operations require instant, highly dependable access without waiting for email delivery cycles.
- **Strict RBAC Verification (`is_admin()`)**: Authenticating against Supabase Auth is only step one. The server action and middleware verify that the user's UUID exists in the `public.admin_users` table. If a customer attempts to sign in via the admin gate, they are immediately signed out and returned a generic _"Access denied. Invalid credentials"_ error, preventing email enumeration.
- **Middleware Fortress**: Any unauthenticated or non-admin user attempting to access any `/admin/*` route is intercepted by middleware and redirected to `/admin/login`.
- **Role Hierarchy (`owner` vs `staff`)**: Differentiates operational staff (orders, catalog view) from store proprietors (`owner`), who retain exclusive rights over destructive catalog actions, admin provisioning, and financial settings.
- **Brute-Force Throttling**: In-process attempt rate limiter locks access for 15 minutes after 5 consecutive failed attempts per IP/email (architected for Upstash Redis expansion).

---

## 🛠 Available Scripts

- `pnpm dev` — Start the Next.js development server with Turbopack
- `pnpm build` — Build the application for production
- `pnpm start` — Start the production server
- `pnpm run lint` — Run ESLint across the codebase
- `pnpm run format` — Format all files with Prettier
- `pnpm run format:check` — Verify code formatting
- `pnpm run typecheck` — Run TypeScript compiler check without emitting files

---

## 🏛 Legal Information

- **Brand Name**: Velaash
- **Legal Entity**: VELAASH TRADER'S
- **Tagline**: Where Heritage Craft Meets Contemporary Elegance
