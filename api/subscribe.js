import { createClient } from '@supabase/supabase-js';

// Load environment variables for Supabase credentials.
// These should be set in your Vercel project settings.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Handles the email subscription request.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export default async function handler(req, res) {
  // Only allow POST requests to this endpoint.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;

  // Validate that an email address was provided.
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    // Insert the new email into the 'subscribers' table.
    // The `ignoreDuplicates: true` option handles cases where a user
    // tries to subscribe with the same email multiple times.
    const { error } = await supabase
      .from('subscribers')
      .insert([
        { email: email }
      ]);

    if (error) {
      // If the error code indicates a unique constraint violation, it means
      // the email is already in the database.
      if (error.code === '23505') {
        return res.status(409).json({ message: 'This email is already subscribed.' });
      }
      // For any other database error, return a generic error message.
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to subscribe due to a server error.' });
    }

    // If the insertion was successful, send a success response.
    return res.status(200).json({ message: 'Successfully subscribed!' });
  } catch (err) {
    // Catch any unexpected errors during the process.
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  }
}
