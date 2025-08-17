import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// IMPORTANT: Never expose these credentials in frontend code.
// Set these as environment variables in your Vercel project settings.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use the service role key for backend access
const nodemailerEmail = process.env.NODEMAILER_EMAIL;
const nodemailerPassword = process.env.NODEMAILER_PASSWORD;

if (!supabaseUrl || !supabaseKey || !nodemailerEmail || !nodemailerPassword) {
  console.error("Missing environment variables. Please check your .env file or Vercel settings.");
  process.exit(1);
}

// Initialize Supabase client with the service role key for full read access.
const supabase = createClient(supabaseUrl, supabaseKey);

// Create a Nodemailer transporter.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: nodemailerEmail,
    pass: nodemailerPassword,
  },
});

/**
 * Sends a notification email to all subscribers about a new blog post.
 * @param {string} postTitle - The title of the new blog post.
 * @param {string} postUrl - The URL of the new blog post.
 */
async function sendNewPostNotification(postTitle, postUrl) {
  try {
    // 1. Fetch all subscribed emails from the database.
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('email');

    if (error) {
      throw new Error(`Failed to fetch subscribers: ${error.message}`);
    }

    if (subscribers.length === 0) {
      console.log('No subscribers found.');
      return;
    }

    // 2. Loop through each subscriber and send an email.
    const promises = subscribers.map(subscriber => {
      const mailOptions = {
        from: nodemailerEmail,
        to: subscriber.email,
        subject: `New Post Alert: ${postTitle}`,
        html: `
          <h1>New Blog Post on Digital Indian</h1>
          <p>We just published a new article: <strong>${postTitle}</strong></p>
          <p>Read it now: <a href="${postUrl}">${postUrl}</a></p>
          <p>Thank you for staying updated with us!</p>
        `,
      };
      
      return transporter.sendMail(mailOptions);
    });

    // Wait for all emails to be sent.
    await Promise.all(promises);
    console.log(`Successfully sent email notifications to ${subscribers.length} subscribers.`);
  } catch (err) {
    console.error('Error in sendNewPostNotification:', err);
  }
}

// Example usage:
// This function needs to be called with the new post's details.
// For example:
// sendNewPostNotification('The Future of Digital India', 'https://digitalindian.com/blog/future-of-digital-india');
