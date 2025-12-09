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

    // Also explicitly check for API Key and Company ID
    const apiKeyCheck = await query('SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?, ?)', ['whatsappApiKey', 'whatsappCompanyId']);
    console.log('[settings/get] Direct API Key/Company ID query:', {
      success: apiKeyCheck.success,
      data: apiKeyCheck.data,
      apiKeyFound: apiKeyCheck.data?.find(r => r.setting_key === 'whatsappApiKey'),
      companyIdFound: apiKeyCheck.data?.find(r => r.setting_key === 'whatsappCompanyId'),
    });

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
        gmailEmail: process.env.GMAIL_EMAIL || "careers@ikf.co.in",
        gmailAppPassword: process.env.GMAIL_APP_PASSWORD || "qellqgrcmusuypyy",
        googleClientId: process.env.GOOGLE_CLIENT_ID || "",
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
        googleSenderEmail: process.env.GOOGLE_SENDER_EMAIL || "",
        whatsappSendingEnabled: true,
        whatsappApiKey: process.env.WHATSAPP_API_KEY || "9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN",
        whatsappApiUrl: "https://publicapi.myoperator.co/chat/messages",
        whatsappPhoneNumberId: "8044186875",
        whatsappCompanyId: process.env.WHATSAPP_COMPANY_ID || "689044bc84f5e822",
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
      
      // Debug: Log what we found in database for API Key and Company ID
      console.log('[settings/get] Raw database values:', {
        totalRows: result.data.length,
        whatsappApiKey: settings.whatsappApiKey ? `***${String(settings.whatsappApiKey).slice(-4)} (${String(settings.whatsappApiKey).length} chars)` : 'not found',
        whatsappApiKeyRaw: settings.whatsappApiKey !== undefined ? (settings.whatsappApiKey || 'empty string') : 'not in DB',
        whatsappApiKeyType: typeof settings.whatsappApiKey,
        whatsappCompanyId: settings.whatsappCompanyId ? `***${String(settings.whatsappCompanyId).slice(-4)} (${String(settings.whatsappCompanyId).length} chars)` : 'not found',
        whatsappCompanyIdRaw: settings.whatsappCompanyId !== undefined ? (settings.whatsappCompanyId || 'empty string') : 'not in DB',
        whatsappCompanyIdType: typeof settings.whatsappCompanyId,
        allSettingKeys: Object.keys(settings),
        allSettingsRaw: settings,
      });
    } else {
      console.log('[settings/get] No data returned from database query:', {
        hasResult: !!result,
        hasData: !!result.data,
        isArray: Array.isArray(result.data),
        resultData: result.data,
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
      gmailEmail: process.env.GMAIL_EMAIL || "careers@ikf.co.in",
      gmailAppPassword: process.env.GMAIL_APP_PASSWORD || "qellqgrcmusuypyy",
      googleClientId: process.env.GOOGLE_CLIENT_ID || "",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
      googleSenderEmail: process.env.GOOGLE_SENDER_EMAIL || "",
        whatsappSendingEnabled: true,
        whatsappApiKey: process.env.WHATSAPP_API_KEY || "9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN",
        whatsappApiUrl: "https://publicapi.myoperator.co/chat/messages",
        whatsappPhoneNumberId: "8044186875",
        whatsappCompanyId: process.env.WHATSAPP_COMPANY_ID || "689044bc84f5e822",
        whatsappTemplateName: "resume_screener_message01",
        whatsappLanguage: "en",
    };
    
    // Merge: Start with defaults (includes env vars), then override with database values
    // Priority: Non-empty DB values > Env vars > Hardcoded defaults
    // IMPORTANT: Database values take highest priority - if saved locally, they will load on Vercel
    const mergedSettings = { ...DEFAULT_SETTINGS };
    for (const [key, dbValue] of Object.entries(settings)) {
      // Use database value if it exists and is non-empty (user saved a value)
      // This ensures API Key and Company ID saved locally will load on Vercel
      // Special handling for API Key and Company ID - they should always use DB value if present
      if (key === 'whatsappApiKey' || key === 'whatsappCompanyId') {
        // For API Key and Company ID, use DB value if it exists (even if empty string means user cleared it)
        if (dbValue !== null && dbValue !== undefined) {
          mergedSettings[key] = dbValue; // Use DB value even if empty (user explicitly cleared it)
          console.log(`[settings/get] Using DB value for ${key}:`, dbValue ? `***${String(dbValue).slice(-4)} (${String(dbValue).length} chars)` : 'empty string');
        } else {
          console.log(`[settings/get] ${key} not in DB, using default/env`);
        }
      } else if (dbValue !== null && dbValue !== undefined && dbValue !== "") {
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
    // Also include raw database values for debugging
    const rawDbValues = {
      whatsappApiKey: settings.whatsappApiKey !== undefined ? settings.whatsappApiKey : null,
      whatsappCompanyId: settings.whatsappCompanyId !== undefined ? settings.whatsappCompanyId : null,
    };
    
    console.log('[settings/get] Final merged settings being returned:', {
      hasApiKey: !!mergedSettings.whatsappApiKey && mergedSettings.whatsappApiKey !== "",
      hasCompanyId: !!mergedSettings.whatsappCompanyId && mergedSettings.whatsappCompanyId !== "",
      apiKeyLength: mergedSettings.whatsappApiKey?.length || 0,
      companyIdLength: mergedSettings.whatsappCompanyId?.length || 0,
      apiKeySource: settings.whatsappApiKey !== undefined && settings.whatsappApiKey !== "" ? 'database' : (process.env.WHATSAPP_API_KEY ? 'env' : 'default'),
      companyIdSource: settings.whatsappCompanyId !== undefined && settings.whatsappCompanyId !== "" ? 'database' : (process.env.WHATSAPP_COMPANY_ID ? 'env' : 'default'),
      rawDbApiKey: rawDbValues.whatsappApiKey !== null ? (rawDbValues.whatsappApiKey ? `***${String(rawDbValues.whatsappApiKey).slice(-4)}` : 'empty string') : 'not in DB',
      rawDbCompanyId: rawDbValues.whatsappCompanyId !== null ? (rawDbValues.whatsappCompanyId ? `***${String(rawDbValues.whatsappCompanyId).slice(-4)}` : 'empty string') : 'not in DB',
      settingsObjectKeys: Object.keys(settings),
      settingsObjectSize: Object.keys(settings).length,
    });
    
    return res.status(200).json({
      success: true,
      data: mergedSettings,
      // Always include raw database values so frontend can prioritize them
      _rawDb: {
        whatsappApiKey: settings.whatsappApiKey !== undefined ? settings.whatsappApiKey : null,
        whatsappCompanyId: settings.whatsappCompanyId !== undefined ? settings.whatsappCompanyId : null,
        allSettings: settings, // Include all raw DB settings (even if empty)
        hasAnySettings: Object.keys(settings).length > 0,
      },
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
      gmailEmail: "careers@ikf.co.in",
      gmailAppPassword: "qellqgrcmusuypyy",
      googleClientId: "",
      googleClientSecret: "",
      googleRefreshToken: "",
      googleSenderEmail: "",
      whatsappSendingEnabled: true,
      whatsappApiKey: "9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN",
      whatsappApiUrl: "https://publicapi.myoperator.co/chat/messages",
      whatsappPhoneNumberId: "8044186875",
      whatsappCompanyId: "689044bc84f5e822",
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

