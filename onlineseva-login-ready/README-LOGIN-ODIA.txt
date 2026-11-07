# Online Seva JLS — Customer Login Version

This package adds a Supabase email/password customer login and self-registration screen to the existing static website. The original service catalogue, design, search and service links are retained.

## Before deploying

1. Create a project at https://supabase.com/.
2. In Supabase, open **Project Settings → API** and copy the **Project URL** and **anon/public key**.
3. Edit `js/supabase-config.js` and replace:
   - `PASTE_SUPABASE_PROJECT_URL_HERE`
   - `PASTE_SUPABASE_ANON_PUBLIC_KEY_HERE`
4. In Supabase **Authentication → URL Configuration**, set the Site URL to:
   `https://onlinesevajls.netlify.app`
   Add this Redirect URL too:
   `https://onlinesevajls.netlify.app/**`
5. In Supabase **Authentication → Providers → Email**, keep Email enabled. You can enable email confirmation for new accounts.
6. Push the updated project files to your GitHub repository. Netlify will redeploy automatically if GitHub is already connected.

## Customer account flow

- Each customer registers with their own email ID and password.
- If email confirmation is enabled, they must verify their email before logging in.
- Customers can use **Forgot Password?** to receive a reset email.
- The existing service portal is displayed only after a valid login session is found.
- Logout returns the browser to the login screen.

## Important security note

This is a front-end login gate for the static service portal. It does not make public static files, JSON files, or third-party government websites private. Do not store customer documents, passwords, Aadhaar/PAN data, or other sensitive information in this static project. If you later add customer records, payments, private downloads, or admin-only data, those must be stored behind Supabase Row Level Security (RLS) policies and server-side authorization.

Never put a Supabase `service_role` key, database password, or other secret in browser JavaScript or GitHub. Only the Supabase anon/public key belongs in `supabase-config.js`.

## Files added

- `css/auth.css` — login and registration page styling
- `js/supabase-config.js` — Supabase public project configuration
- `js/auth.js` — login, registration, password reset and logout

## Test locally

Run the project through a local web server (not `file://`), for example:
`python -m http.server 5500`
Then open `http://localhost:5500`.
