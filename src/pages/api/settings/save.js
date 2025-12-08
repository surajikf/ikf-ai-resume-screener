import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const settings = req.body;

    // Save each setting
    const results = [];
    for (const [key, value] of Object.entries(settings)) {
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
      message: 'Settings saved to database',
      results,
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save settings',
      details: error.message,
    });
  }
}

