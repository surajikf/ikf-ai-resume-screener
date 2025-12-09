import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const {
    to,
    subject,
    body,
    emailSendingEnabled,
    gmailEmail,
    gmailAppPassword,
    googleClientId,
    googleClientSecret,
    googleRefreshToken,
    googleSenderEmail,
  } = req.body || {};

  if (!to || !subject || !body) {
    res.status(400).json({ error: "Missing required fields: to, subject, body." });
    return;
  }

  if (!emailSendingEnabled) {
    console.log("[send-email] Email sending is disabled. Requested payload:", {
      to,
      subject,
      preview: body.slice(0, 120),
    });

    res.status(200).json({
      success: true,
      status: "simulated",
      message: "Email sending is disabled in settings.",
    });
    return;
  }

  let emailStatus = "sent";
  let errorMessage = null;
  let messageId = null;

  try {
    // Try Gmail SMTP first (simpler - uses email + app password)
    if (gmailEmail && gmailAppPassword) {
      // Remove spaces from app password (Gmail app passwords are 16 characters, no spaces)
      const cleanAppPassword = gmailAppPassword.replace(/\s+/g, '');
      
      if (cleanAppPassword.length !== 16) {
        throw new Error("Gmail App Password must be 16 characters. Please check your app password in Settings.");
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailEmail.trim(),
          pass: cleanAppPassword, // This should be an App Password, not regular password
        },
      });

      const mailOptions = {
        from: gmailEmail.trim(),
        to: to.trim(),
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br>'), // Also send as HTML for better formatting
      };

      const info = await transporter.sendMail(mailOptions);
      messageId = info.messageId;
      console.log("[send-email] Email sent via Gmail SMTP:", {
        to,
        subject,
        messageId: info.messageId,
        from: gmailEmail,
      });
      emailStatus = "sent";
    }
    // Fallback to Gmail API (OAuth2) if SMTP credentials not available
    else if (googleClientId && googleClientSecret && googleRefreshToken && googleSenderEmail) {
      const { google } = require('googleapis');
      
      const oauth2Client = new google.auth.OAuth2(
        googleClientId,
        googleClientSecret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      oauth2Client.setCredentials({
        refresh_token: googleRefreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const messageParts = [
        `To: ${to}`,
        `From: ${googleSenderEmail}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        body,
      ];

      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      messageId = response.data.id;
      console.log("[send-email] Email sent via Gmail API:", {
        to,
        subject,
        messageId: response.data.id,
      });
      emailStatus = "sent";
    } else {
      throw new Error("Missing email credentials. Please provide either Gmail email + App Password, or Gmail API OAuth2 credentials.");
    }
  } catch (error) {
    console.error("[send-email] Email sending error:", error);
    emailStatus = "failed";
    errorMessage = error.message || 'Failed to send email';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data || error.message,
    });
    return;
  }

  // Log to database if evaluationId is provided
  const { evaluationId } = req.body || {};
  if (evaluationId) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/logs/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId,
          toEmail: to,
          subject,
          body,
          status: emailStatus,
          errorMessage,
        }),
      });
    } catch (logError) {
      console.log('Email log save failed:', logError);
    }
  }

  res.status(200).json({
    success: true,
    status: emailStatus,
    message: emailStatus === "sent" ? "Email sent successfully via Gmail API" : "Email sending failed",
    messageId: emailStatus === "sent" ? "sent" : null,
  });
}


