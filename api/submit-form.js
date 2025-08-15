import nodemailer from 'nodemailer';
import busboy from 'busboy';
import dotenv from 'dotenv';

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
    const fields = {};
    const files = {};

    try {
      const bb = busboy({ 
        headers: req.headers,
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB file size limit
        }
      });

      bb.on('file', (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        
        if (!filename) {
          // If no filename, just drain the file stream
          file.resume();
          return;
        }

        const buffers = [];
        
        file.on('data', (data) => {
          buffers.push(data);
        });

        file.on('end', () => {
          if (buffers.length > 0) {
            files[fieldname] = {
              filename: filename,
              content: Buffer.concat(buffers),
              contentType: mimeType,
              encoding: encoding
            };
          }
        });

        file.on('error', (err) => {
          console.error('File stream error:', err);
          reject(err);
        });
      });

      bb.on('field', (fieldname, val) => {
        fields[fieldname] = val;
      });

      bb.on('finish', () => {
        resolve({ fields, files });
      });

      bb.on('error', (err) => {
        console.error('Busboy error:', err);
        reject(err);
      });

      bb.on('close', () => {
        console.log('Busboy parsing completed');
      });

      // Handle request end/close events properly
      req.on('error', (err) => {
        console.error('Request error:', err);
        reject(err);
      });

      req.on('aborted', () => {
        console.error('Request aborted');
        reject(new Error('Request aborted'));
      });

      // Pipe the request to busboy
      req.pipe(bb);

    } catch (error) {
      console.error('Error setting up busboy:', error);
      reject(error);
    }
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
      // Check if the request has content
      if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
        return res.status(400).json({ error: 'Invalid content type. Expected multipart/form-data.' });
      }

      const { fields, files } = await parseForm(req);

      // Extract form data
      const name = fields.name;
      const email = fields.email;
      const company = fields.company;
      const phone = fields.phone;
      const message = fields.message;
      const document = files.document;

      // Validate required fields
      if (!name || !email || !message) {
        return res.status(400).json({ 
          error: 'Missing required form fields.',
          received: { name: !!name, email: !!email, message: !!message }
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
      }

      // Check for required environment variables
      if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASSWORD) {
        console.error('Missing email configuration');
        return res.status(500).json({ error: 'Email service not configured' });
      }

      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.NODEMAILER_EMAIL,
          pass: process.env.NODEMAILER_PASSWORD,
        },
      });

      // Verify transporter configuration
      try {
        await transporter.verify();
      } catch (verifyError) {
        console.error('Email transporter verification failed:', verifyError);
        return res.status(500).json({ error: 'Email service configuration error' });
      }

      const mailOptions = {
        from: process.env.NODEMAILER_EMAIL, // Use your email as sender
        replyTo: email, // Set reply-to as the form submitter's email
        to: process.env.NODEMAILER_EMAIL,
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2c5282;">New Contact Form Submission</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Name:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Company:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${company || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${phone || 'Not provided'}</td>
              </tr>
            </table>
            <h3 style="color: #2c5282;">Message:</h3>
            <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin-top: 10px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            ${document ? '<p style="margin-top: 20px;"><strong>Attachment:</strong> Document attached to this email</p>' : ''}
          </div>
        `,
        attachments: document ? [{
          filename: document.filename,
          content: document.content,
          contentType: document.contentType,
        }] : [],
      };

      await transporter.sendMail(mailOptions);
      
      console.log(`Email sent successfully from ${email}`);
      res.status(200).json({ 
        message: 'Email sent successfully!',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Handler error:', error);
      
      // Don't expose internal errors to client
      const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message;
        
      res.status(500).json({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

export default handler;