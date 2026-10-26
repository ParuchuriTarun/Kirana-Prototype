import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bhztxyialsqlkwoydska.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FDmK7Ab7CjJi2u0lwnj-NA_-pTmdXn7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
