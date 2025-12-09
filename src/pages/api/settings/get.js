import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { keys } = req.query;
    let sql = 'SELECT setting_key, setting_value FROM settings';
    const params = [];

    if (keys) {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      sql += ' WHERE setting_key IN (' + keyArray.map(() => '?').join(',') + ')';
      params.push(...keyArray);
    }

    const result = await query(sql, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    const settings = {};
    result.data.forEach(row => {
      try {
        settings[row.setting_key] = JSON.parse(row.setting_value);
      } catch {
        settings[row.setting_key] = row.setting_value;
      }
    });

    // If no settings exist, initialize with defaults
    if (Object.keys(settings).length === 0) {
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

      // Save defaults to database
      try {
        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
          await query(
            `INSERT INTO settings (setting_key, setting_value) 
             VALUES (?, ?) 
             ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
            [key, JSON.stringify(value), JSON.stringify(value)]
          );
        }
        // Return defaults
        return res.status(200).json({
          success: true,
          data: DEFAULT_SETTINGS,
          initialized: true,
        });
      } catch (initError) {
        console.error('Failed to initialize defaults:', initError);
        // Still return defaults even if save fails
        return res.status(200).json({
          success: true,
          data: DEFAULT_SETTINGS,
          initialized: false,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
      details: error.message,
    });
  }
}

