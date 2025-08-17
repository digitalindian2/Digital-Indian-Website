// pages/api/unsubscribe.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables locally
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send('❌ Missing email parameter');
  }

  try {
    const { error } = await supabase
      .from('subscribers')
      .delete()
      .eq('email', email);

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).send('❌ Failed to unsubscribe');
    }

    return res
      .status(200)
      .send('✅ You have been unsubscribed from Digital Indian updates.');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return res.status(500).send('❌ Unexpected error occurred');
  }
}
