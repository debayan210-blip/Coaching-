# Coaching Marketplace MVP

A responsive Next.js MVP for discovering coaching centres and booking long-duration courses.

## Included
- Student-facing discovery dashboard with search and category filters
- Course cards with fees, duration, location, rating and seats
- Six-month booking intent flow (demo only)
- Demo booking confirmation and student booking list
- Centre partner dashboard with sample seat inventory
- Admin overview with demo GMV and 15% commission calculations
- Responsive mobile navigation

## Run locally
1. Install Node.js 18.17+.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open http://localhost:3000.

## Important
This is a frontend prototype using local demo data. It does not yet provide authentication, database persistence, real-time inventory, payment processing, refunds, GST invoices, notifications, or production security. Do not accept real payments with this prototype.

## Suggested production architecture
- Next.js frontend + API routes or a separate NestJS service
- PostgreSQL (users, centres, courses, batches, seat inventory, bookings, payments, commissions)
- Auth.js / OTP provider for authentication
- Razorpay or Cashfree with verified webhooks
- Role-based access: student, centre manager, operations, super admin
- Transactional seat locking and idempotent booking/payment workflows

## Core commercial rules
- Minimum booking duration: 6 months
- Platform commission: 15% of eligible booking value
- First 10,000 centre onboardings: free (commercial policy; not implemented as billing)
- Seat availability must be confirmed by the centre before payment capture in production
