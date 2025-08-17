import nodemailer from 'nodemailer';
import busboy from 'busboy';
import dotenv from 'dotenv';

// Load local env variables in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

export const config = {
  api: {
    bodyParser: false, // disable default body parsing
  },
};

// Parse multipart form
const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields = {};
    const files = {};

    bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const buffers = [];
      file.on('data', (data) => buffers.push(data));
      file.on('end', () => {
        if (buffers.length > 0) {
          files[fieldname] = {
            filename, // ✅ correct usage
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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fields, files } = await parseForm(req);

    const { name, email, company, phone, message } = fields;
    const document = files.document;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Check environment variables
    if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASSWORD) {
      return res.status(500).json({ error: 'Email service not configured.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const mailOptions = {
      from: email,
      to: process.env.NODEMAILER_EMAIL,
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
