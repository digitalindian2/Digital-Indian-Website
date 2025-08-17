import nodemailer from 'nodemailer';
import busboy from 'busboy';
import dotenv from 'dotenv';
import { PassThrough } from 'stream';

// Load environment variables locally
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

export const config = {
  api: { bodyParser: false },
};

// Parse multipart form
const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields = {};
    const files = {};

    bb.on('file', (fieldname, file, info) => { // ✅ CORRECTED: Use 'info' object from busboy for filename
      const { filename, encoding, mimetype } = info;
      const buffers = [];
      file.on('data', (data) => buffers.push(data));
      file.on('end', () => {
        if (buffers.length > 0) {
          files[fieldname] = {
            filename,
            content: Buffer.concat(buffers),
            contentType: mimetype,
          };
        }
      });
    });

    bb.on('field', (fieldname, val) => (fields[fieldname] = val));
    bb.on('finish', () => resolve({ fields, files }));
    bb.on('error', (err) => reject(err));

    req.pipe(bb);
  });

const handler = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { fields, files } = await parseForm(req);

    const { name, email, company, phone, message } = fields;
    const document = files.document;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields: name, email, or message.' });
    }

    // Check env variables
    const userEmail = process.env.NODEMAILER_EMAIL;
    const userPassword = process.env.NODEMAILER_PASSWORD;

    if (!userEmail || !userPassword) {
      return res.status(500).json({ error: 'Email service not configured on the server.' });
    }

    // Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: userEmail, pass: userPassword },
    });

    const mailOptions = {
      from: email,
      to: userEmail,
      subject: `Contact Form Submission from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'N/A'}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
      attachments: document
        ? [
            {
              filename: document.filename,
              content: document.content,
              contentType: document.contentType,
            },
          ]
        : [],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Email sent successfully!' });
  } catch (err) {
    console.error('API Handler Error:', err);

    // ALWAYS respond with JSON
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: err.message || 'Internal Server Error',
    });
  }
};

export default handler;