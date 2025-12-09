import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
      console.error('[settings/get] Failed to create settings table:', tableError);
      // Continue anyway - table might already exist
    }

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
      console.error('[settings/get] Query failed:', result.error);
      // Return defaults instead of error if database query fails
      // Hardcoded credentials - available by default
      const DEFAULT_SETTINGS = {
        emailSignature: [
          "Best regards,",
          "Jahanvi Patel",
          "I Knowledge Factory Pvt. Ltd.",
          "📞 +91 9665079317",
        ].join("\n"),
        emailSendingEnabled: false,
        gmailEmail: process.env.GMAIL_EMAIL || "",
        gmailAppPassword: process.env.GMAIL_APP_PASSWORD || "",
        googleClientId: process.env.GOOGLE_CLIENT_ID || "",
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
        googleSenderEmail: process.env.GOOGLE_SENDER_EMAIL || "",
        whatsappSendingEnabled: true,
        whatsappApiKey: process.env.WHATSAPP_API_KEY || "",
        whatsappApiUrl: "https://publicapi.myoperator.co/chat/messages",
        whatsappPhoneNumberId: "690875100784871",
        whatsappCompanyId: process.env.WHATSAPP_COMPANY_ID || "",
        whatsappTemplateName: "resume_screener_message01",
        whatsappLanguage: "en",
      };
      return res.status(200).json({
        success: true,
        data: DEFAULT_SETTINGS,
        fallback: true,
        error: result.error,
      });
    }

    const settings = {};
    if (result.data && Array.isArray(result.data)) {
      result.data.forEach(row => {
        try {
          const parsed = JSON.parse(row.setting_value);
          settings[row.setting_key] = parsed;
        } catch {
          // If JSON parse fails, use the raw value
          settings[row.setting_key] = row.setting_value;
        }
      });
    }
    
    // Hardcoded defaults with environment variables
    const DEFAULT_SETTINGS = {
      emailSignature: [
        "Best regards,",
        "Jahanvi Patel",
        "I Knowledge Factory Pvt. Ltd.",
        "📞 +91 9665079317",
      ].join("\n"),
      emailSendingEnabled: false,
      gmailEmail: process.env.GMAIL_EMAIL || "",
      gmailAppPassword: process.env.GMAIL_APP_PASSWORD || "",
      googleClientId: process.env.GOOGLE_CLIENT_ID || "",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
      googleSenderEmail: process.env.GOOGLE_SENDER_EMAIL || "",
      whatsappSendingEnabled: true,
      whatsappApiKey: process.env.WHATSAPP_API_KEY || "",
      whatsappApiUrl: "https://publicapi.myoperator.co/chat/messages",
      whatsappPhoneNumberId: "690875100784871",
      whatsappCompanyId: process.env.WHATSAPP_COMPANY_ID || "",
      whatsappTemplateName: "resume_screener_message01",
      whatsappLanguage: "en",
    };
    
    // Merge: Start with defaults (includes env vars), then override with database values
    // Priority: Non-empty DB values > Env vars > Hardcoded defaults
    const mergedSettings = { ...DEFAULT_SETTINGS };
    for (const [key, dbValue] of Object.entries(settings)) {
      // Use database value if it exists and is non-empty (user saved a value)
      if (dbValue !== null && dbValue !== undefined && dbValue !== "") {
        mergedSettings[key] = dbValue;
      }
      // If database has empty string, check if env var exists for credentials
      // For API Key and Company ID: if DB is empty but env var exists, use env var
      // Otherwise, if DB explicitly has empty string, it means user cleared it
      else if (dbValue === "" && (key === "whatsappApiKey" || key === "whatsappCompanyId")) {
        if (key === "whatsappApiKey" && process.env.WHATSAPP_API_KEY) {
          mergedSettings[key] = process.env.WHATSAPP_API_KEY;
        } else if (key === "whatsappCompanyId" && process.env.WHATSAPP_COMPANY_ID) {
          mergedSettings[key] = process.env.WHATSAPP_COMPANY_ID;
        }
        // If no env var, keep empty (user cleared it)
      }
      // If database value is null/undefined (not set), keep the default/env var value
    }
    
    // Backfill any non-empty merged values into DB when DB is missing/empty
    try {
      const missingToPersist = Object.entries(mergedSettings).filter(([key, value]) => {
        const dbVal = settings[key];
        const hasDbVal = dbVal !== null && dbVal !== undefined && dbVal !== "";
        const hasMergedVal = value !== null && value !== undefined && value !== "";
        return !hasDbVal && hasMergedVal;
      });

      for (const [key, value] of missingToPersist) {
        await query(
          `INSERT INTO settings (setting_key, setting_value)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
          [key, JSON.stringify(value), JSON.stringify(value)]
        );
      }
    } catch (persistErr) {
      console.error("[settings/get] Backfill to DB failed:", persistErr);
    }

    console.log('[settings/get] Settings merge result:', {
      dbSettingsCount: Object.keys(settings).length,
      hasApiKeyInDb: !!settings.whatsappApiKey && settings.whatsappApiKey !== "",
      hasCompanyIdInDb: !!settings.whatsappCompanyId && settings.whatsappCompanyId !== "",
      apiKeyFromEnv: !!process.env.WHATSAPP_API_KEY,
      companyIdFromEnv: !!process.env.WHATSAPP_COMPANY_ID,
      finalHasApiKey: !!mergedSettings.whatsappApiKey,
      finalHasCompanyId: !!mergedSettings.whatsappCompanyId,
      finalApiKeyLength: mergedSettings.whatsappApiKey?.length || 0,
      finalCompanyIdLength: mergedSettings.whatsappCompanyId?.length || 0,
    });

    // If no settings exist or result.data is empty/undefined, initialize with defaults
    if (!result.data || !Array.isArray(result.data) || Object.keys(settings).length === 0) {
      // Save defaults to database (try, but don't fail if it doesn't work)
      try {
        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
          const saveResult = await query(
            `INSERT INTO settings (setting_key, setting_value) 
             VALUES (?, ?) 
             ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
            [key, JSON.stringify(value), JSON.stringify(value)]
          );
          if (!saveResult.success) {
            console.error(`Failed to save setting ${key}:`, saveResult.error);
          }
        }
        // Return defaults
        return res.status(200).json({
          success: true,
          data: DEFAULT_SETTINGS,
          initialized: true,
        });
      } catch (initError) {
        console.error('Failed to initialize defaults:', initError);
        // Still return defaults even if save fails - this ensures the app works
        return res.status(200).json({
          success: true,
          data: DEFAULT_SETTINGS,
          initialized: false,
          error: initError.message,
        });
      }
    }

    // Return merged settings (database values + env vars/defaults)
    return res.status(200).json({
      success: true,
      data: mergedSettings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return defaults instead of 500 error - ensures app works even if DB fails
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
    return res.status(200).json({
      success: true,
      data: DEFAULT_SETTINGS,
      fallback: true,
      error: error.message,
    });
  }
}

