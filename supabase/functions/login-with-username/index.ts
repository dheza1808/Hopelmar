import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (status: number, body: Record<string, unknown>) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
);

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  let payload: { username?: unknown; password?: unknown };
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid request.' });
  }

  const username = typeof payload.username === 'string' ? payload.username.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  if (!/^[a-z0-9._-]{3,64}$/.test(username) || password.length === 0 || password.length > 256) {
    return jsonResponse(200, { error: 'Username atau password salah.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Username login is missing Supabase server environment variables.');
    return jsonResponse(500, { error: 'Login username belum dikonfigurasi di server.' });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('email')
    .eq('username', username)
    .maybeSingle();

  if (profileError) {
    console.error('Username lookup failed:', profileError.message);
    return jsonResponse(500, { error: 'Login username gagal diproses.' });
  }
  if (!profile?.email) {
    return jsonResponse(200, { error: 'Username atau password salah.' });
  }

  const { data, error } = await authClient.auth.signInWithPassword({
    email: profile.email,
    password,
  });
  if (error || !data.session) {
    return jsonResponse(200, { error: 'Username atau password salah.' });
  }

  return jsonResponse(200, {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});
