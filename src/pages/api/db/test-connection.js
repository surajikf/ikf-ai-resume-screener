import { testConnection } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await testConnection();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.message,
        details: result.error,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to test database connection',
      details: error.message,
    });
  }
}

