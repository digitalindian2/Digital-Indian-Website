import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // ⚠️ use service key, not anon
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { title, link } = req.body;

  // 1. Get all subscribers
  const { data: subscribers, error } = await supabase.from("subscribers").select("email");
  if (error) return res.status(500).json({ error: "Failed to fetch subscribers" });

  // 2. Setup email transporter
  const transporter = nodemailer.createTransport({
    service: "gmail", // or SMTP provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 3. Send to all subscribers
  for (const sub of subscribers) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: sub.email,
      subject: `New Blog: ${title}`,
      text: `Check out the new blog here: ${link}`,
    });
  }

  return res.status(200).json({ message: "Notifications sent!" });
}
