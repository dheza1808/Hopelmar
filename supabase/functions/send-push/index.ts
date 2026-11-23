import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

interface NotificationWebhookPayload {
  type?: string;
  table?: string;
  record?: {
    user_id?: unknown;
    title?: unknown;
    message?: unknown;
    target_tab?: unknown;
  };
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  }

  const expectedSecret = Deno.env.get('NOTIFICATION_WEBHOOK_SECRET');
  if (!expectedSecret || request.headers.get('x-notification-secret') !== expectedSecret) {
    return Response.json({ error: 'Unauthorized webhook.' }, { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT');
  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return Response.json({ error: 'Push notification server secrets are not configured.' }, { status: 500 });
  }

  try {
    const payload = await request.json() as NotificationWebhookPayload;
    const record = payload.record;
    if (
      payload.type !== 'INSERT'
      || payload.table !== 'notifications'
      || typeof record?.user_id !== 'string'
      || typeof record.title !== 'string'
      || typeof record.message !== 'string'
    ) {
      return Response.json({ error: 'Invalid notification webhook payload.' }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: subscriptions, error: subscriptionError } = await adminClient
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', record.user_id)
      .eq('device_type', 'mobile');
    if (subscriptionError) throw subscriptionError;

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const notification = JSON.stringify({
      title: record.title,
      body: record.message,
      url: '/',
    });
    const expiredIds: string[] = [];
    let sent = 0;
    for (const item of subscriptions || []) {
      try {
        await webpush.sendNotification(item.subscription, notification);
        sent += 1;
      } catch (error) {
        const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
          ? error.statusCode
          : undefined;
        if (statusCode === 404 || statusCode === 410) {
          expiredIds.push(item.id);
        } else {
          console.error('Push delivery failed.', error);
        }
      }
    }

    if (expiredIds.length) {
      const { error: cleanupError } = await adminClient
        .from('push_subscriptions')
        .delete()
        .in('id', expiredIds);
      if (cleanupError) console.error('Could not remove expired push subscriptions.', cleanupError);
    }

    return Response.json({ sent, expired: expiredIds.length });
  } catch (error) {
    console.error('Push notification webhook failed.', error);
    return Response.json({ error: 'Push notification could not be sent.' }, { status: 500 });
  }
});
