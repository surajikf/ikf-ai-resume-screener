import { query, getConnection } from '@/lib/db';

/**
 * Save settings to database
 * 
 * IMPORTANT: Settings saved here persist across:
 * - Git pushes and code deployments
 * - Vercel deployments
 * - Local development restarts
 * 
 * Once credentials are saved in the Settings page, they will automatically
 * be available to all users on both local and Vercel deployments.
 * No need to re-enter credentials after deployment.
 */
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
        message: 'Settings data is missing or invalid',
      });
    }

    console.log('[settings/save] Saving settings:', {
      keysCount: Object.keys(settings).length,
      keys: Object.keys(settings),
      hasApiKey: !!settings.whatsappApiKey,
      hasCompanyId: !!settings.whatsappCompanyId,
    });

    // Use a single connection to save all settings in a transaction
    // This prevents "too many connections" errors
    let connection = null;
    const results = [];
    let allSuccess = true;
    const errors = [];
    
    try {
      // Get a single connection for all operations
      connection = await getConnection();
      
      // Start transaction
      await connection.beginTransaction();
      
      // Prepare all settings for batch insert
      const settingsEntries = Object.entries(settings);
      
      // Use a single query with multiple VALUES or execute sequentially in same connection
      for (const [key, value] of settingsEntries) {
        try {
          await connection.execute(
            `INSERT INTO settings (setting_key, setting_value) 
             VALUES (?, ?) 
             ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
            [key, JSON.stringify(value), JSON.stringify(value)]
          );
          results.push({ key, success: true });
        } catch (err) {
          allSuccess = false;
          const errorMsg = err.message || 'Unknown error';
          console.error(`Failed to save setting ${key}:`, errorMsg);
          errors.push(`${key}: ${errorMsg}`);
          results.push({ key, success: false, error: errorMsg });
        }
      }
      
      // Commit transaction if all succeeded, otherwise rollback
      if (allSuccess) {
        await connection.commit();
        console.log('[settings/save] All settings saved successfully');
      } else {
        await connection.rollback();
        console.error('[settings/save] Transaction rolled back due to errors');
      }
      
    } catch (err) {
      // Rollback on any error
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackErr) {
          console.error('[settings/save] Rollback error:', rollbackErr);
        }
      }
      allSuccess = false;
      const errorMsg = err.message || 'Unknown error';
      console.error('[settings/save] Transaction error:', err);
      errors.push(`Transaction failed: ${errorMsg}`);
    } finally {
      // Always release the connection
      if (connection) {
        try {
          connection.release();
        } catch (releaseErr) {
          console.error('[settings/save] Error releasing connection:', releaseErr);
        }
      }
    }

    return res.status(200).json({
      success: allSuccess,
      message: allSuccess ? 'Settings saved to database' : 'Some settings failed to save',
      error: errors.length > 0 ? errors.join('; ') : undefined,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });
  } catch (error) {
    console.error('[settings/save] Error saving settings:', error);
    // Return 200 with error instead of 500 - app can still function
    return res.status(200).json({
      success: false,
      error: error.message || 'Failed to save settings',
      details: error.message || 'Unknown error occurred',
      message: 'Settings may not have been saved, but app will continue to work',
    });
  }
}

