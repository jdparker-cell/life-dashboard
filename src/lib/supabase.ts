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

export async function syncToSupabase(table: string, data: any): Promise<boolean> {
  if (!hasSupabase || !supabaseClient) return false;
  try {
    const { error } = await supabaseClient.from(table).upsert(data, { onConflict: 'id' });
    return !error;
  } catch { return false; }
}

export async function fetchFromSupabase(table: string): Promise<any[]> {
  if (!hasSupabase || !supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient.from(table).select('*');
    if (error) return [];
    return data || [];
  } catch { return []; }
}
