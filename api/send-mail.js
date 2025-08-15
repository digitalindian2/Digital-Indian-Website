import nodemailer from "nodemailer";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // Required for formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Handle newsletter subscription from JSON body
  if (req.headers['content-type']?.includes('application/json')) {
    const { email, type } = req.body;
    if (type !== 'newsletter' || !email) {
      return res.status(400).json({ success: false, message: "Invalid request for subscription" });
    }
    
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: "ankurr.era@gmail.com",
        subject: `New Newsletter Subscription`,
        html: `
          <h2>New Subscriber!</h2>
          <p>The following email has subscribed to the newsletter:</p>
          <p><strong>Email:</strong> ${email}</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ success: true, message: "Subscription email sent!" });
      
    } catch (error) {
      console.error("Error sending subscription email:", error);
      return res.status(500).json({ success: false, message: "Error sending subscription email" });
    }
  }

  // Handle file-based form submission (for contact form)
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ success: false, message: "Form parsing failed" });
    }

    const { name, email, company, phone, message } = fields;
    const document = files.document;

    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: "ankurr.era@gmail.com",
        replyTo: email,
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <h2>New Message from Your Website</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || "N/A"}</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
        attachments: [],
      };

      if (document) {
        mailOptions.attachments.push({
          filename: document.originalFilename,
          content: fs.readFileSync(document.filepath),
        });
      }

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ success: true, message: "Email sent successfully!" });

    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ success: false, message: "Error sending email" });
    }
  });
}