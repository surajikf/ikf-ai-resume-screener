import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Total evaluations
    const totalEvals = await query('SELECT COUNT(*) as total FROM evaluations');
    const totalEvaluations = totalEvals.success ? totalEvals.data[0].total : 0;

    // Evaluations by verdict
    const verdictStats = await query(`
      SELECT verdict, COUNT(*) as count 
      FROM evaluations 
      GROUP BY verdict
    `);
    const verdictCounts = verdictStats.success 
      ? verdictStats.data.reduce((acc, row) => {
          acc[row.verdict] = row.count;
          return acc;
        }, {})
      : {};

    // Average match score
    const avgScore = await query(`
      SELECT AVG(match_score) as avg_score 
      FROM evaluations
    `);
    const averageScore = avgScore.success ? Math.round(avgScore.data[0].avg_score || 0) : 0;

    // Evaluations by role
    const roleStats = await query(`
      SELECT role_applied, COUNT(*) as count, AVG(match_score) as avg_score
      FROM evaluations
      GROUP BY role_applied
      ORDER BY count DESC
      LIMIT 10
    `);
    const topRoles = roleStats.success ? roleStats.data.map(row => ({
      role: row.role_applied,
      count: row.count,
      avgScore: Math.round(row.avg_score || 0),
    })) : [];

    // Recent activity (last 7 days)
    const recentActivity = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM evaluations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    const activity = recentActivity.success ? recentActivity.data.map(row => ({
      date: row.date,
      count: row.count,
    })) : [];

    // Total candidates
    const totalCandidates = await query('SELECT COUNT(DISTINCT candidate_id) as total FROM evaluations');
    const uniqueCandidates = totalCandidates.success ? totalCandidates.data[0].total : 0;

    // Email/WhatsApp stats
    const emailStats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM email_logs
    `);
    const emailData = emailStats.success ? emailStats.data[0] : { total: 0, sent: 0, failed: 0 };

    const whatsappStats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM whatsapp_logs
    `);
    const whatsappData = whatsappStats.success ? whatsappStats.data[0] : { total: 0, sent: 0, failed: 0 };

    // Score distribution
    const scoreDistribution = await query(`
      SELECT 
        CASE 
          WHEN match_score >= 80 THEN '80-100'
          WHEN match_score >= 50 THEN '50-79'
          ELSE '0-49'
        END as range,
        COUNT(*) as count
      FROM evaluations
      GROUP BY range
    `);
    const distribution = scoreDistribution.success ? scoreDistribution.data.map(row => ({
      range: row.range,
      count: row.count,
    })) : [];

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalEvaluations,
          uniqueCandidates,
          averageScore,
        },
        verdicts: verdictCounts,
        topRoles,
        activity,
        messaging: {
          email: emailData,
          whatsapp: whatsappData,
        },
        scoreDistribution: distribution,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      details: error.message,
    });
  }
}

