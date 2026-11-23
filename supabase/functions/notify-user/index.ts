import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: corsHeaders });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return Response.json({ error: 'Authentication is required.' }, { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT');
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return Response.json({ error: 'Push notification server secrets are not configured.' }, { status: 500, headers: corsHeaders });
  }

  try {
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData.user) {
      return Response.json({ error: 'Invalid user session.' }, { status: 401, headers: corsHeaders });
    }

    const payload = await request.json();
    if (typeof payload.message !== 'string' || payload.message.length === 0 || payload.message.length > 300) {
      return Response.json({ error: 'A message of at most 300 characters is required.' }, { status: 400, headers: corsHeaders });
    }
    const title = typeof payload.title === 'string' && payload.title.length <= 100
      ? payload.title
      : 'Hopelmar Job Tracker';

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: subscriptions, error: subscriptionError } = await adminClient
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', userData.user.id)
      .eq('device_type', 'mobile');
    if (subscriptionError) throw subscriptionError;

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const notification = JSON.stringify({
      title,
      body: payload.message,
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

    return Response.json({ sent, expired: expiredIds.length }, { headers: corsHeaders });
  } catch (error) {
    console.error('Push notification request failed.', error);
    return Response.json({ error: 'Push notification could not be sent.' }, { status: 500, headers: corsHeaders });
  }
});
