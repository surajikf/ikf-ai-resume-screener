// Helper endpoint to get Gmail OAuth2 refresh token
// This is a one-time setup process

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const { clientId, clientSecret } = req.query || {};

  if (!clientId || !clientSecret) {
    res.status(400).json({
      error: "Missing clientId or clientSecret",
      instructions: `
To get your Gmail OAuth2 Refresh Token:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (if not already created)
3. Set Authorized redirect URIs to: http://localhost:3001/api/gmail-oauth/callback
4. Use the OAuth 2.0 Playground:
   - Go to: https://developers.google.com/oauthplayground/
   - Click the gear icon (⚙️) → Use your own OAuth credentials
   - Enter your Client ID and Client Secret
   - In the left panel, find "Gmail API v1"
   - Select: https://www.googleapis.com/auth/gmail.send
   - Click "Authorize APIs"
   - After authorization, click "Exchange authorization code for tokens"
   - Copy the "Refresh token" value
5. Enter the refresh token in Settings

Alternatively, use the simple Gmail App Password method (recommended).
      `,
    });
    return;
  }

  // Generate OAuth URL
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/gmail-oauth/callback`;
  const scopes = 'https://www.googleapis.com/auth/gmail.send';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;

  res.status(200).json({
    authUrl,
    instructions: "Visit the authUrl to authorize and get refresh token",
  });
}

