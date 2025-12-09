import { query } from '@/lib/db';

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
      console.error('[settings/save] Failed to create settings table:', tableError);
      // Continue anyway - table might already exist
    }

    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid settings data',
      });
    }

    // Save each setting
    const results = [];
    let allSuccess = true;
    
    for (const [key, value] of Object.entries(settings)) {
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
          console.error(`Failed to save setting ${key}:`, result.error);
        }
      } catch (err) {
        allSuccess = false;
        console.error(`Error saving setting ${key}:`, err);
        results.push({ key, success: false, error: err.message });
      }
    }

    return res.status(200).json({
      success: allSuccess,
      message: allSuccess ? 'Settings saved to database' : 'Some settings failed to save',
      results,
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    // Return 200 with error instead of 500 - app can still function
    return res.status(200).json({
      success: false,
      error: 'Failed to save settings',
      details: error.message,
      message: 'Settings may not have been saved, but app will continue to work',
    });
  }
}

