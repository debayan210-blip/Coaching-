# ClassOrbit — Supabase-connected Next.js starter

## Included
- Next.js 14 App Router frontend
- Supabase browser client using `@supabase/ssr`
- Email/password sign-up and sign-in
- Student profile editing
- Centre registration request
- Course and batch creation
- Published course discovery
- Six-month booking request flow and booking history

## Setup
1. Copy `.env.example` to `.env.local`.
2. In Supabase Dashboard → Project Settings → API Keys, copy the **Publishable key** and put it in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Keep the publishable key public; never put a `sb_secret_...` or `service_role` key in this app.
4. Run `npm install`, then `npm run dev`.
5. In Vercel Project Settings → Environment Variables, add the same two variables and redeploy.

## Important production notes
- Database schema is expected to exist already in Supabase.
- Centre verification/admin publishing needs a separate trusted admin workflow before public launch.
- This starter does not include Razorpay checkout, webhook verification, refunds, or a production admin console.
- Do not accept payment based only on a browser response. Payment must be verified server-side via a signed webhook.
- Configure Supabase Auth email templates and redirect URLs for localhost and your production domain.
