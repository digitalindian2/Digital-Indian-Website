import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, excerpt, link } = req.body;

  if (!title || !excerpt || !link) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1️⃣ Fetch all subscribers from Supabase
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('email');

    if (error) {
      console.error('❌ Error fetching subscribers:', error);
      return res.status(500).json({ error: 'Failed to fetch subscribers' });
    }

    if (!subscribers || subscribers.length === 0) {
      return res.status(200).json({ message: 'No subscribers found' });
    }

    // 2️⃣ Setup Nodemailer transporter (using your SMTP config)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3️⃣ Send email to each subscriber
    const sendEmails = subscribers.map((subscriber) =>
      transporter.sendMail({
        from: `"Digital Indian" <${process.env.SMTP_USER}>`,
        to: subscriber.email,
        subject: `📢 New Blog Post: ${title}`,
        html: `
          <h2>${title}</h2>
          <p>${excerpt}</p>
          <p><a href="${link}" target="_blank">👉 Read full post here</a></p>
        `,
      })
    );

    await Promise.all(sendEmails);

    console.log(`✅ Notifications sent to ${subscribers.length} subscribers`);
    return res.status(200).json({ message: 'Notifications sent successfully!' });
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}