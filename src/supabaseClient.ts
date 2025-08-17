// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// ✅ These will be injected by Vercel (Project Settings → Environment Variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
