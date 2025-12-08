// OAuth callback handler to get refresh token
import { google } from 'googleapis';

export default async function handler(req, res) {
  const { code, state } = req.query;
  const { clientId, clientSecret } = JSON.parse(Buffer.from(state, 'base64').toString()) || {};

  if (!code) {
    return res.status(400).send('Authorization code not found');
  }

  if (!clientId || !clientSecret) {
    return res.status(400).send('Client credentials not found');
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/gmail-oauth/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      return res.status(400).send(`
        <html>
          <body>
            <h2>Refresh Token Not Found</h2>
            <p>Please revoke access and try again with prompt=consent in the authorization URL.</p>
            <p>Refresh Token: ${tokens.access_token ? 'Access token received but no refresh token. You may need to revoke previous access.' : 'No tokens received'}</p>
            <p><a href="/settings">Go to Settings</a></p>
          </body>
        </html>
      `);
    }

    res.status(200).send(`
      <html>
        <head>
          <title>Gmail OAuth Success</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .token { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>✅ Gmail OAuth Authorization Successful!</h1>
          <div class="success">
            <p><strong>Your Refresh Token:</strong></p>
            <div class="token">${tokens.refresh_token}</div>
          </div>
          <div class="warning">
            <p><strong>⚠️ Important:</strong></p>
            <ol>
              <li>Copy the refresh token above</li>
              <li>Go to Settings page</li>
              <li>Paste it in the "Google Refresh Token" field</li>
              <li>Enter your Gmail address in "Sender Email Address"</li>
              <li>Save settings</li>
            </ol>
          </div>
          <p><a href="/settings" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Go to Settings</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`
      <html>
        <body>
          <h2>Error</h2>
          <p>${error.message}</p>
          <p><a href="/settings">Go to Settings</a></p>
        </body>
      </html>
    `);
  }
}

