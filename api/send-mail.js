import nodemailer from "nodemailer";
import busboy from "busboy";
import dotenv from "dotenv";

// Load environment variables in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local" });
}

export const config = {
  api: { bodyParser: false }, // Disable Next.js body parsing so Busboy can handle streams
};

// ✅ Safe Busboy parser
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields = {};
    const files = [];

    // Handle file uploads
    bb.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];

      file.on("data", (data) => chunks.push(data));

      file.on("end", () => {
        if (filename) {
          files.push({
            filename,
            content: Buffer.concat(chunks),
            contentType: mimeType,
          });
        }
      });
    });

    // Handle text fields
    bb.on("field", (fieldname, val) => {
      fields[fieldname] = val;
    });

    // Fires when Busboy is completely done parsing
    bb.on("finish", () => {
      resolve({ fields, files });
    });

    bb.on("error", (err) => {
      console.error("Busboy error:", err);
      reject(err);
    });

    req.pipe(bb); // Pipe incoming request into Busboy
  });
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    try {
      const { fields, files } = await parseForm(req);

      const { name, email, message } = fields;

      if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required form fields." });
      }

      // Nodemailer setup
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.NODEMAILER_EMAIL,
          pass: process.env.NODEMAILER_PASSWORD,
        },
      });

      // Email options
      const mailOptions = {
        from: process.env.NODEMAILER_EMAIL,
        to: process.env.NODEMAILER_EMAIL,
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> ${message}</p>
        `,
        attachments: files,
      };

      // Send the email
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "Email sent successfully!" });
    } catch (error) {
      console.error("Error in handler:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
