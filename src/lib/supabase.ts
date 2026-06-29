const SYNC_PASSPHRASE_KEY = 'life-dashboard-sync-passphrase';
const STORAGE_KEY = 'life-dashboard-data';

const supabaseUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
const supabaseAnonKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;

export const hasSupabase = !!(supabaseUrl && supabaseAnonKey);

let supabaseClient: any = null;

if (hasSupabase) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
  } catch {
    supabaseClient = null;
  }
}

export { supabaseClient };

function hashPassphrase(passphrase: string): string {
  let hash = 5381;
  for (let i = 0; i < passphrase.length; i++) {
    hash = ((hash << 5) + hash) + passphrase.charCodeAt(i);
    hash = hash & hash;
  }
  return 'u_' + Math.abs(hash).toString(36);
}

export function getSyncPassphrase(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SYNC_PASSPHRASE_KEY);
}

export function getUserId(): string | null {
  const passphrase = getSyncPassphrase();
  if (!passphrase) return null;
  return hashPassphrase(passphrase);
}

export function setSyncPassphrase(passphrase: string): void {
  localStorage.setItem(SYNC_PASSPHRASE_KEY, passphrase);
}

export function clearSyncPassphrase(): void {
  localStorage.removeItem(SYNC_PASSPHRASE_KEY);
}

export async function loadFromCloud(): Promise<any | null> {
  const userId = getUserId();
  if (!hasSupabase || !supabaseClient || !userId) return null;
  try {
    const { data, error } = await supabaseClient
      .from('app_data')
      .select('data')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return data.data;
  } catch {
    return null;
  }
}

export async function saveToCloud(appData: any): Promise<boolean> {
  const userId = getUserId();
  if (!hasSupabase || !supabaseClient || !userId) return false;
  try {
    const { error } = await supabaseClient
      .from('app_data')
      .upsert({ user_id: userId, data: appData, updated_at: new Date().toISOString() });
    return !error;
  } catch {
    return false;
  }
}
