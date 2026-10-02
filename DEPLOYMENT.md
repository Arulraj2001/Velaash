# Velaash E-Commerce Platform — Production Deployment Guide

**Legal Entity:** VELAASH TRADER'S  
**Target Platform:** Netlify (OpenNext Next.js Runtime)  
**Framework:** Next.js 16 (App Router, Turbopack)  

---

## 1. Architecture Overview

Velaash is architected for serverless cloud execution on Netlify:
- **Frontend / Rendering:** Next.js 16 App Router (SSR, Dynamic Route Handlers, React Server Components)
- **Runtime Plugin:** `@netlify/plugin-nextjs` handles serverless functions, server actions, and edge middleware
- **Authoritative Database & Auth:** Supabase PostgreSQL with Row-Level Security (RLS)
- **Payment Processing:** Razorpay Orders API + Webhook Confirmation
- **Logistics & Tracking:** Shiprocket Logistics API (v1 External)
- **Transactional Email:** Resend API
- **Distributed Rate Limiting:** Upstash Redis (Sliding Window)
- **Error & Performance Monitoring:** Sentry (`@sentry/nextjs`)
- **Analytics & Attribution:** Google Analytics 4, Meta Pixel, Microsoft Clarity (strictly gated behind user cookie consent)

---

## 2. Environment Variables Checklist for Netlify

In the Netlify Dashboard, navigate to:  
**Site Configuration** > **Environment variables** > **Add variable**

Configure the following variables:

### A. Core Platform
| Variable | Scope | Requirement | Description / Value |
|---|---|:---:|---|
| `NODE_ENV` | Server | **REQUIRED** | Set to `production`. |
| `NEXT_PUBLIC_APP_URL` | Public / Browser | **REQUIRED** | Live store URL with HTTPS (`https://velaash.in`). |

### B. Supabase (Database, Auth & Storage)
| Variable | Scope | Requirement | Description / Value |
|---|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Browser | **REQUIRED** | `https://<project-ref>.supabase.co`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Browser | **REQUIRED** | Public client anonymous key. |
| `SUPABASE_SERVICE_ROLE_KEY` | **SERVER-ONLY SECRET** | **REQUIRED** | Service-role key. Bypasses RLS for orders, inventory deductions, admin actions, and webhooks. **NEVER prefix with NEXT_PUBLIC_**. |

### C. Razorpay Payment Gateway
| Variable | Scope | Requirement | Description / Value |
|---|---|:---:|---|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public / Browser | **REQUIRED FOR LIVE PAYMENTS** | Must start with `rzp_live_`. Build fails if `rzp_test_` is used in production. |
| `RAZORPAY_KEY_SECRET` | **SERVER-ONLY SECRET** | **REQUIRED FOR LIVE PAYMENTS** | Live key secret generated in Razorpay Dashboard > Settings > API Keys. |
| `RAZORPAY_WEBHOOK_SECRET` | **SERVER-ONLY SECRET** | **REQUIRED FOR WEBHOOKS** | Secret configured for `https://velaash.in/api/webhooks/razorpay`. |

### D. Transactional Emails (Resend)
| Variable | Scope | Requirement | Description / Value |
|---|---|:---:|---|
| `RESEND_API_KEY` | **SERVER-ONLY SECRET** | **REQUIRED FOR LIVE EMAILS** | Starts with `re_...`. Generated in Resend Dashboard. |
| `EMAIL_FROM` | Server | **REQUIRED FOR LIVE EMAILS** | Must use a verified domain (e.g. `Velaash <orders@velaash.in>`). Sandbox `@resend.dev` is blocked in production. |

### E. Shiprocket Logistics
| Variable | Scope | Requirement | Description / Value |
|---|---|:---:|---|
| `SHIPROCKET_EMAIL` | **SERVER-ONLY SECRET** | **OPTIONAL** | Shiprocket account login email. (Mock fallback if absent). |
| `SHIPROCKET_PASSWORD` | **SERVER-ONLY SECRET** | **OPTIONAL** | Shiprocket account password. (Mock fallback if absent). |

### F. Rate Limiting (Upstash Redis)
| Variable | Scope | Requirement | Description / Value |
|---|---|:---:|---|
| `UPSTASH_REDIS_REST_URL` | **SERVER-ONLY SECRET** | **OPTIONAL** | Upstash Redis REST endpoint. (Falls back to in-memory if absent). |
| `UPSTASH_REDIS_REST_TOKEN` | **SERVER-ONLY SECRET** | **OPTIONAL** | Upstash Redis REST bearer token. |

### G. Sentry Error Monitoring & Source Maps
| Variable | Scope | Requirement | Description / Value |
|---|---|:---:|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Public / Browser | **OPTIONAL** | Sentry client DSN. Captures client errors, API failures, and webhook issues. |
| `SENTRY_AUTH_TOKEN` | **SERVER-ONLY SECRET** | **OPTIONAL** | Token with `project:write` for uploading release source maps during build. |
| `SENTRY_ORG` | Server | **OPTIONAL** | Organization slug in Sentry (e.g. `velaash`). |
| `SENTRY_PROJECT` | Server | **OPTIONAL** | Project slug in Sentry (e.g. `velaash-nextjs`). |

### H. Analytics & Marketing Attribution (Consent-Gated)
| Variable | Scope | Requirement | Description / Value |
|---|---|:---:|---|
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Public / Browser | **OPTIONAL** | Google Analytics 4 (e.g. `G-XXXXXXXXXX`). |
| `NEXT_PUBLIC_META_PIXEL_ID` | Public / Browser | **OPTIONAL** | Meta / Facebook Pixel ID (numeric string). |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Public / Browser | **OPTIONAL** | Microsoft Clarity project ID (set in Netlify env vars). |

### I. Search Engine Verification
| Variable | Scope | Requirement | Description / Value |
|---|---|:---:|---|
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Public / Browser | **OPTIONAL** | Google Search Console HTML tag content value (set in Netlify env vars). |

---

## 3. Post-Deployment External Webhook Setup

### Razorpay Webhook Registration
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/) > **Settings** > **Webhooks**.
2. Click **Add New Webhook**.
3. **Webhook URL:** `https://velaash.in/api/webhooks/razorpay`
4. **Secret:** Set a strong random secret and copy it to Netlify as `RAZORPAY_WEBHOOK_SECRET`.
5. **Alert Email:** `orders@velaash.in`
6. **Active Events:**
   - `payment.captured`
   - `payment.failed`

### Pending Online Order Cleanup
The order-cleanup migration enables `pg_cron` and schedules expired Razorpay reservations every 15 minutes. After applying migrations, verify that the job is active in Supabase:

```sql
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'velaash-expire-pending-online-orders';
```

If the migration role cannot enable `pg_cron`, enable it under Supabase Database Extensions, then rerun the atomic checkout migration and verify the job again.

### Resend Domain Verification
1. Log in to [Resend Dashboard](https://resend.com/domains).
2. Add custom domain: `velaash.in`.
3. Add the provided DNS records (MX, SPF TXT, DKIM TXT) in your domain registrar (e.g. Cloudflare / GoDaddy / Namecheap).
4. Verify domain status shows **Verified** before setting `EMAIL_FROM="Velaash <orders@velaash.in>"`.

---

## 4. Built-in Safety & Protection Features

1. **Production Credential Guard ([lib/production-guard.ts](file:///d:/Software/velaash/lib/production-guard.ts)):**
   - Automatically executes during `next build` when `NODE_ENV=production`.
   - Fails the build immediately if `rzp_test_` or placeholder credentials are detected.
   - Warns prominently if unverified sandbox emails or localhost URLs are active.

2. **Destructive Script Guard ([lib/script-guard.ts](file:///d:/Software/velaash/lib/script-guard.ts)):**
   - Blocks seed scripts and scratch mutations from executing against live production databases.
   - Requires explicit `--confirm-production` CLI flag to run.

3. **Sentry PII & Payment Scrubber ([lib/sentry-scrubber.ts](file:///d:/Software/velaash/lib/sentry-scrubber.ts)):**
   - Automatically sanitizes customer phone numbers, addresses, card data, and cryptographic signatures before events leave the server or browser.

---

## 5. Verification Commands

Run the following checks locally or in CI prior to deploying:

```bash
# 1. Typecheck the entire TypeScript codebase
npm run typecheck

# 2. Lint for code style and compiler warnings
npm run lint

# 3. Verify production readiness, Sentry scrubber, and .env.example parity
npx tsx scratch/test-production-readiness.ts

# 4. Compile the full Next.js production bundle
npm run build
```
