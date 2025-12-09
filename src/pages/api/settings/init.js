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
    // First, ensure settings table exists
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS \`settings\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`setting_key\` VARCHAR(100) NOT NULL UNIQUE,
          \`setting_value\` TEXT DEFAULT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_setting_key\` (\`setting_key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (tableError) {
      console.error('[settings/init] Failed to create settings table:', tableError);
      // Continue anyway - table might already exist
    }

    // Check if settings already exist
    const checkResult = await query('SELECT COUNT(*) as count FROM settings');
    
    if (!checkResult.success) {
      console.error('[settings/init] Failed to check settings:', checkResult.error);
      // If query fails, try to initialize anyway
    }

    const existingCount = checkResult.data && Array.isArray(checkResult.data) && checkResult.data[0] 
      ? checkResult.data[0].count 
      : 0;

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
    let allSuccess = true;
    
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      try {
        const result = await query(
          `INSERT INTO settings (setting_key, setting_value) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
          [key, JSON.stringify(value), JSON.stringify(value)]
        );
        results.push({ key, success: result.success });
        if (!result.success) {
          allSuccess = false;
          console.error(`Failed to initialize setting ${key}:`, result.error);
        }
      } catch (err) {
        allSuccess = false;
        console.error(`Error initializing setting ${key}:`, err);
        results.push({ key, success: false, error: err.message });
      }
    }

    return res.status(200).json({
      success: allSuccess,
      message: allSuccess ? 'Default settings initialized in database' : 'Some settings failed to initialize',
      initialized: allSuccess,
      results,
    });
  } catch (error) {
    console.error('Error initializing settings:', error);
    // Return success with error message instead of 500 - app can still work
    return res.status(200).json({
      success: false,
      message: 'Failed to initialize settings, but defaults are available',
      initialized: false,
      error: error.message,
      // Still return defaults so app can use them
      defaults: DEFAULT_SETTINGS,
    });
  }
}

