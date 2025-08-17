import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Debug log for environment variables (only log if missing to avoid exposing keys)
if (!supabaseUrl) console.error("❌ Missing SUPABASE_URL");
if (!supabaseKey) console.error("❌ Missing SUPABASE_ANON_KEY");

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log("📩 Incoming request body:", req.body);

  const { email } = req.body || {};

  if (!email) {
    console.error("❌ Email missing in request body");
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const { error } = await supabase
      .from('subscribers')
      .insert([{ email }]);

    if (error) {
      console.error("❌ Supabase insert error:", error);
      if (error.code === '23505') {
        return res.status(409).json({ message: 'This email is already subscribed.' });
      }
      return res.status(500).json({ error: 'Failed to subscribe due to a server error.' });
    }

    console.log("✅ Email subscribed:", email);
    return res.status(200).json({ message: 'Successfully subscribed!' });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  }
}
