import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

let _supabase = null;
let _config = null;

export async function getConfig() {
  if (_config) return _config;
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Failed to load config');
  _config = await res.json();
  return _config;
}

export async function getSupabase() {
  if (_supabase) return _supabase;
  const cfg = await getConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    throw new Error('Supabase env vars not configured');
  }
  _supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _supabase;
}

export async function getUser() {
  const sb = await getSupabase();
  const { data } = await sb.auth.getUser();
  return data.user;
}
