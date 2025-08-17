// /api/notify-subscribers.js

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ✅ Make sure you use SERVICE ROLE key
);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // or your provider
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, excerpt, link } = req.body;

  try {
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('email');

    if (error) throw error;

    if (!subscribers || subscribers.length === 0) {
      return res.status(200).json({ message: 'No subscribers to notify.' });
    }

    // HTML email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #1d4ed8;">${title}</h2>
        <p>${excerpt}</p>
        <a href="${link}" 
           style="display:inline-block; margin-top:12px; padding:10px 18px; background:#1d4ed8; color:#fff; text-decoration:none; border-radius:6px;">
           Read Full Post
        </a>
        <p style="margin-top:20px; font-size:12px; color:#888;">
          You’re receiving this email because you subscribed to our newsletter.  
          <br />If you no longer wish to receive these emails, you can unsubscribe anytime.
        </p>
      </div>
    `;

    // Send email to all subscribers
    await Promise.all(
      subscribers.map(subscriber =>
        transporter.sendMail({
          from: `"Digital Indian Blog" <${process.env.EMAIL_USER}>`,
          to: subscriber.email,
          subject: `New Blog Post: ${title}`,
          html: htmlContent,
        })
      )
    );

    res.status(200).json({ message: 'Notifications sent successfully!' });
  } catch (err) {
    console.error('Error notifying subscribers:', err);
    res.status(500).json({ message: 'Failed to notify subscribers.' });
  }
}
