import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables locally in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, excerpt, link } = req.body;

  if (!title || !excerpt || !link) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1️⃣ Fetch all subscribers
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

    // 2️⃣ Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3️⃣ Send emails
    const sendEmails = subscribers.map((subscriber) =>
      transporter.sendMail({
        from: `"Digital Indian" <${process.env.SMTP_USER}>`,
        to: subscriber.email,
        subject: `📢 New Blog Post: ${title}`,
        html: `
          <html>
          <head>
            <style>
              @media (prefers-color-scheme: dark) {
                body, .email-container { background-color: #121212 !important; color: #e0e0e0 !important; }
                .header { background-color: #1a73e8 !important; color: #fff !important; }
                .content h2 { color: #4fc3f7 !important; }
                .content p { color: #ccc !important; }
                .footer { background-color: #1c1c1c !important; color: #999 !important; }
                a.button { background: linear-gradient(90deg, #4fc3f7, #1a73e8) !important; color: white !important; }
              }
              @media only screen and (max-width: 600px) {
                .email-container { width: 100% !important; }
              }
            </style>
          </head>
          <body style="margin:0; padding:0; background-color:#ffffff; color:#333;">
            <div class="email-container" style="font-family:'Helvetica Neue', Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #ddd; border-radius:10px; overflow:hidden;">

              <!-- Header -->
              <div class="header" style="background-color:#1d72b8; padding:30px; text-align:center; color:white;">
                <h1 style="margin:0; font-size:28px;">Digital Indian</h1>
                <p style="margin:5px 0 0; font-size:14px;">Your weekly dose of tech & insights</p>
              </div>

              <!-- Content -->
              <div class="content" style="padding:25px;">
                <h2 style="color:#1d72b8; font-size:22px; margin-bottom:15px;">${title}</h2>
                <p style="font-size:16px; color:#555; margin-bottom:25px;">${excerpt}</p>
                <p style="text-align:center; margin:30px 0;">
                  <a href="${link}" target="_blank" class="button" 
                     style="background:linear-gradient(90deg, #1d72b8, #4a90e2); color:white; padding:15px 25px; text-decoration:none; border-radius:50px; font-weight:bold; display:inline-block;">
                    Read Full Post
                  </a>
                </p>
              </div>

              <!-- Footer -->
              <div class="footer" style="background-color:#f4f4f4; padding:15px; text-align:center; font-size:12px; color:#999;">
                <p style="margin:0;">You are receiving this email because you subscribed to Digital Indian blog updates.</p>
                <p style="margin:5px 0 0;">&copy; ${new Date().getFullYear()} Digital Indian. All rights reserved.</p>
                <p style="margin:5px 0 0;">
                  <a href="https://yourdomain.com/unsubscribe" target="_blank" style="color:#1d72b8; text-decoration:none;">Unsubscribe</a>
                </p>
              </div>

            </div>
          </body>
          </html>
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
