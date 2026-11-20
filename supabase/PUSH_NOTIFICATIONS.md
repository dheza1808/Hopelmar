# Push notifications

Push notifications require HTTPS, a browser with Web Push support, and a user who has allowed notifications. On iPhone/iPad, install the site to the Home Screen first, then open the installed app and allow notifications. The phone receives alerts only; document changes are made from a laptop/PC.

## Setup

1. Run `supabase/migrations/20261120_add_push_subscriptions.sql` in the Supabase SQL Editor.
2. Generate a VAPID key pair in a trusted local terminal:

   ```powershell
   npx.cmd web-push generate-vapid-keys
   ```

3. Add the public key to the web app environment as `VITE_WEB_PUSH_PUBLIC_KEY`, then rebuild and deploy the web app. Never use the private key in a `VITE_` variable or commit it.
4. Set the private server-side secrets and deploy the function:

   ```powershell
   supabase secrets set VAPID_PUBLIC_KEY=<public-key> VAPID_PRIVATE_KEY=<private-key> VAPID_SUBJECT=mailto:admin@example.com
   supabase functions deploy notify-user
   ```

   Supabase Edge Functions provide `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Keep the service-role key and VAPID private key only in Supabase secrets.

5. In the web app, log in on each device, open the bell menu, and choose **Aktifkan notifikasi HP**. Allow the browser permission prompt.

The function sends alerts to push subscriptions owned by the signed-in user. Workflow data is currently stored in each browser's local storage; cross-user alerts require operational data to be synchronized through Supabase.
