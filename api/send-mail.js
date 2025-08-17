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

    bb.on('file', (fieldname, file, info) => {
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

    // Professional HTML email with logo and CTA
    const mailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background-color: #004aad; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">From DIGITAL INDIAN Website</p>
        </div>

        <!-- Body -->
        <div style="padding: 20px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || 'N/A'}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>

          <p><strong>Message:</strong></p>
          <p style="background: #f1f1f1; padding: 15px; border-radius: 5px;">${message}</p>

          ${
            document
              ? `<p><strong>Attachment:</strong> ${document.filename}</p>`
              : ''
          }

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${email}" 
               style="background-color: #004aad; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; display: inline-block;">
              Reply to ${name}
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; color: #888; text-align: center; font-size: 12px; padding: 10px;">
          This email was automatically generated from your website's contact form.
        </div>
      </div>
    `;

    const mailOptions = {
      from: email,
      to: userEmail,
      subject: `Contact Form Submission from ${name}`,
      html: mailHtml,
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

    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: err.message || 'Internal Server Error',
    });
  }
};

export default handler;
