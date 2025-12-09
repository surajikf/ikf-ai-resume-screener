import { testConnection, getPoolStats, resetPool } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if reset is requested
    const shouldReset = req.query.reset === 'true';
    if (shouldReset) {
      await resetPool();
      // Wait a moment for pool to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const result = await testConnection();
    const poolStats = getPoolStats();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
        poolStats,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.message,
        details: result.error,
        poolStats,
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

