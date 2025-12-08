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

