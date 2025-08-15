import nodemailer from 'nodemailer';
import busboy from 'busboy';
import dotenv from 'dotenv';
import { PassThrough } from 'stream';

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields = {};
    const files = {};
    const buffers = [];

    // Collect the entire request body into a buffer first
    req.on('data', (chunk) => {
      buffers.push(chunk);
    });

    req.on('end', () => {
      const fullBody = Buffer.concat(buffers);
      const bbInstance = busboy({ headers: req.headers });

      bbInstance.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const fileBuffers = [];
        file.on('data', (data) => {
          fileBuffers.push(data);
        });
        file.on('end', () => {
          if (fileBuffers.length > 0) {
            files[fieldname] = {
              filename: filename.filename,
              content: Buffer.concat(fileBuffers),
              contentType: mimetype
            };
          }
        });
      });

      bbInstance.on('field', (fieldname, val) => {
        fields[fieldname] = val;
      });

      bbInstance.on('finish', () => {
        resolve({ fields, files });
      });

      bbInstance.on('error', (err) => {
        console.error('Busboy error:', err);
        reject(err);
      });
      
      // Now, pipe the full body buffer to the busboy instance
      const bufferStream = new PassThrough();
      bufferStream.end(fullBody);
      bufferStream.pipe(bbInstance);
    });

    req.on('error', (err) => {
      console.error('Request stream error:', err);
      reject(err);
    });
  });
};

const handler = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle the POST request for form submission
  if (req.method === 'POST') {
    try {
      const { fields, files } = await parseForm(req);

      // Extract form data, handling busboy's object format
      const name = fields.name;
      const email = fields.email;
      const company = fields.company;
      const phone = fields.phone;
      const message = fields.message;
      const document = files.document;

      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required form fields.' });
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
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || 'N/A'}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Message:</strong> ${message}</p>
        `,
        attachments: document ? [{
          filename: document.filename,
          content: document.content,
          contentType: document.contentType,
        }] : [],
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully!' });
      
    } catch (error) {
      console.error('Final error in handler:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

export default handler;
