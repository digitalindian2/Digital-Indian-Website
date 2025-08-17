import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const { error } = await supabase
      .from('subscribers')
      .insert([{ email }]);

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ message: 'This email is already subscribed.' });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to subscribe due to a server error.' });
    }

    return res.status(200).json({ message: 'Successfully subscribed!' });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  }
}
