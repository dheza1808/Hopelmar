# Push notifications

Push notifications require HTTPS, a browser with Web Push support, and a user who has allowed notifications. On iPhone/iPad, install the site to the Home Screen first, then open the installed app and allow notifications. The phone receives alerts only; document changes are made from a laptop/PC.

## Setup

1. Run these migrations in the Supabase SQL Editor, in this order:
   - `supabase/migrations/20261120_add_push_subscriptions.sql`
   - `supabase/migrations/20261123_add_notification_history.sql`
   - `supabase/migrations/20261123_add_push_device_type.sql`
   - `supabase/migrations/20261123_sync_shared_workflow.sql`
2. Generate a VAPID key pair in a trusted local terminal:

   ```powershell
   npx.cmd web-push generate-vapid-keys
   ```

3. Add the public key to the web app environment as `VITE_WEB_PUSH_PUBLIC_KEY`, then rebuild and deploy the web app. Never use the private key in a `VITE_` variable or commit it.
4. Set server-side secrets and deploy the push dispatcher. Generate a separate random webhook secret and use the exact same value in the database webhook in the next step:

   ```powershell
   $webhookSecret = [guid]::NewGuid().ToString('N')
   $webhookSecret
   supabase secrets set VAPID_PUBLIC_KEY=<public-key> VAPID_PRIVATE_KEY=<private-key> VAPID_SUBJECT=mailto:admin@example.com "NOTIFICATION_WEBHOOK_SECRET=$webhookSecret"
   supabase functions deploy send-push
   ```

   Replace the placeholders (including angle brackets) with the actual values. Use the generated `$webhookSecret` value for `NOTIFICATION_WEBHOOK_SECRET` and in the webhook header; do not put it in the web app.

   Supabase Edge Functions provide `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Keep the service-role key, VAPID private key, and webhook secret only in Supabase secrets.

5. In Supabase Dashboard, create a **Database Webhook**:
   - Table: `public.notifications`
   - Event: `INSERT`
   - Method: `POST`
   - URL: `https://<project-ref>.supabase.co/functions/v1/send-push`
   - Header: `x-notification-secret: <same-random-webhook-secret>`

6. On each phone, log in with the recipient's account, open the bell menu, choose **Aktifkan notifikasi HP**, and allow notifications. If that device had push enabled before applying the device-type migration, turn it off and on again so it is registered as a mobile device.

Customer, quotation, job, and invoice records are synchronized through `workflow_records`. When a quotation moves to `ready_for_support`, Sales Support users receive a history entry and a push on registered mobile devices. When a job enters `exim_work`, Exim users receive the same. When Exim completes work, Sales Support is notified; when the job becomes `ready_for_invoice`, Admin Invoice is notified on Billing/Invoice; when Admin Invoice creates an invoice, Accounting is notified on its Invoice page. The sender's web app must be open to save the workflow change; recipients do not need their web app or laptop open. Push goes only to subscriptions classified as mobile.
