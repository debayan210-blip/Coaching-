ClassOrbit KYC update

Upload these two folders/files into the repository root, preserving paths:
- app/verification/page.tsx
- app/admin/page.tsx

Then commit to main. Routes:
- /verification (signed-in student or centre owner)
- /admin (authorised admin only)

Supabase database migration and private storage buckets/policies were configured separately.
Files accepted: PDF/JPG/PNG/WEBP up to 5 MB.
Aadhaar is optional; only masked Aadhaar is accepted by the UI. Never collect Aadhaar OTP or biometrics.

After commit, wait for Vercel deployment to become Ready and test both routes.
