import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Save WhatsApp log
    try {
      const {
        evaluationId,
        toWhatsApp,
        message,
        status,
        errorMessage,
        messageId,
        conversationId,
      } = req.body;

      if (!evaluationId || !toWhatsApp || !message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const result = await query(
        `INSERT INTO whatsapp_logs (evaluation_id, to_whatsapp, message, status, error_message, message_id, conversation_id, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          evaluationId,
          toWhatsApp,
          message,
          status || 'pending',
          errorMessage || null,
          messageId || null,
          conversationId || null,
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
        message: 'WhatsApp log saved',
        data: { id: result.data.insertId },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save WhatsApp log',
        details: error.message,
      });
    }
  } else if (req.method === 'GET') {
    // Get WhatsApp logs
    try {
      const { evaluationId, limit = 50, offset = 0 } = req.query;

      let sql = 'SELECT * FROM whatsapp_logs WHERE 1=1';
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
        error: 'Failed to fetch WhatsApp logs',
        details: error.message,
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

