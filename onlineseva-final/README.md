# Rajeeb Online Workshop — merged portal

This folder combines the public-facing ROW services catalogue and the Supabase username/email login with the Admin Panel.

## Deployment
Set the Netlify publish directory to:
`onlineseva-final`

No build command is required for this static site.

## Login
- Existing Admin: use the existing Supabase email address and password.
- Customers: use their username/customer ID and password.
- New customer registrations continue to use username-based Supabase Auth identities.

## Supabase
The project configuration is in `js/supabase-config.js`. Keep only the Supabase publishable/anon key in browser code. Never add a service-role key here.
