import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Save email log
    try {
      const { evaluationId, toEmail, subject, body, status, errorMessage } = req.body;

      if (!evaluationId || !toEmail || !subject || !body) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const result = await query(
        `INSERT INTO email_logs (evaluation_id, to_email, subject, body, status, error_message, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          evaluationId,
          toEmail,
          subject,
          body,
          status || 'pending',
          errorMessage || null,
          status === 'sent' ? new Date() : null,
        ]
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Email log saved',
        data: { id: result.data.insertId },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save email log',
        details: error.message,
      });
    }
  } else if (req.method === 'GET') {
    // Get email logs
    try {
      const { evaluationId, limit = 50, offset = 0 } = req.query;

      let sql = 'SELECT * FROM email_logs WHERE 1=1';
      const params = [];

      if (evaluationId) {
        sql += ' AND evaluation_id = ?';
        params.push(evaluationId);
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const result = await query(sql, params);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch email logs',
        details: error.message,
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

