# ConnectNetwork Admin

Private operations dashboard for ConnectNetwork. Deploy this repository separately to `admin.connectnetwork.co.za`.

## Connection model

The dashboard browser speaks only to this application's protected routes. Those server routes call the public-site control API using `CONNECTNETWORK_ADMIN_API_KEY`; this key must be identical in both deployments and never exposed as a `NEXT_PUBLIC_*` variable.

## Local setup

1. Copy `.env.example` to `.env.local` and set its values.
2. Start the public ConnectNetwork site on port 3000.
3. Start this project with `npm run dev`; it uses port 3001.
4. In Supabase Auth, add `http://localhost:3001/api/auth/google/callback` and the production dashboard callback URL to the approved redirects.

## Production

Set `CONNECTNETWORK_API_URL=https://connectnetwork.co.za` and `NEXT_PUBLIC_WEBSITE_URL=https://connectnetwork.co.za`. Use a distinct `ADMIN_SESSION_SECRET` for this repository.
