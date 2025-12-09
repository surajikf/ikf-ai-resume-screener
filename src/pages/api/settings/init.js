import { query } from '@/lib/db';

const DEFAULT_SETTINGS = {
  emailSignature: [
    "Best regards,",
    "Jahanvi Patel",
    "I Knowledge Factory Pvt. Ltd.",
    "📞 +91 9665079317",
  ].join("\n"),
  emailSendingEnabled: false,
  gmailEmail: "",
  gmailAppPassword: "",
  googleClientId: "",
  googleClientSecret: "",
  googleRefreshToken: "",
  googleSenderEmail: "",
  whatsappSendingEnabled: true,
  whatsappApiKey: "",
  whatsappApiUrl: "https://publicapi.myoperator.co/chat/messages",
  whatsappPhoneNumberId: "690875100784871",
  whatsappCompanyId: "",
  whatsappTemplateName: "resume_screener_message01",
  whatsappLanguage: "en",
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if settings already exist
    const checkResult = await query('SELECT COUNT(*) as count FROM settings');
    
    if (!checkResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check settings',
        details: checkResult.error,
      });
    }

    const existingCount = checkResult.data[0]?.count || 0;

    // If settings already exist, don't overwrite
    if (existingCount > 0) {
      return res.status(200).json({
        success: true,
        message: 'Settings already initialized',
        initialized: false,
      });
    }

    // Initialize with default settings
    const results = [];
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const result = await query(
        `INSERT INTO settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
        [key, JSON.stringify(value), JSON.stringify(value)]
      );
      results.push({ key, success: result.success });
    }

    return res.status(200).json({
      success: true,
      message: 'Default settings initialized in database',
      initialized: true,
      results,
    });
  } catch (error) {
    console.error('Error initializing settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize settings',
      details: error.message,
    });
  }
}

