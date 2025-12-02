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
      status: "simulated",
      message: "Email sending is disabled in settings.",
    });
    return;
  }

  // Check if all Gmail API credentials are provided
  if (!googleClientId || !googleClientSecret || !googleRefreshToken || !googleSenderEmail) {
    res.status(400).json({
      error: "Missing Gmail API credentials. Please configure all fields in Settings.",
    });
    return;
  }

  // TODO: Implement actual Gmail API integration here
  // You can use the googleapis npm package:
  // npm install googleapis
  //
  // Example implementation:
  // const { google } = require('googleapis');
  // const oauth2Client = new google.auth.OAuth2(
  //   googleClientId,
  //   googleClientSecret
  // );
  // oauth2Client.setCredentials({ refresh_token: googleRefreshToken });
  // const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  // 
  // Then use gmail.users.messages.send() to send the email

  console.log("[send-email] Email send request received:", {
    to,
    subject,
    from: googleSenderEmail,
    hasCredentials: !!(googleClientId && googleClientSecret && googleRefreshToken),
  });

  res.status(200).json({
    status: "accepted",
    message: "Email send request received. Gmail API integration pending - implement in /api/send-email.js",
  });
}


