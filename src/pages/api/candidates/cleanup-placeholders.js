import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const isMySQL = process.env.DB_PROVIDER !== 'supabase';
    const { dryRun = true } = req.body || {};

    // Identify placeholder candidates: default/blank name + no contact/info
    const selectSql = `
      SELECT id
      FROM candidates
      WHERE (candidate_name IS NULL OR TRIM(candidate_name) = '' OR LOWER(candidate_name) = 'candidate')
        AND (candidate_email IS NULL OR candidate_email = '')
        AND (candidate_whatsapp IS NULL OR candidate_whatsapp = '')
        AND (linkedin_url IS NULL OR linkedin_url = '')
        AND (candidate_location IS NULL OR TRIM(candidate_location) = '')
        AND (current_company IS NULL OR current_company = '')
        AND (current_designation IS NULL OR current_designation = '')
    `;

    const placeholderResult = await query(selectSql);
    if (!placeholderResult.success) {
      return res.status(500).json({ success: false, error: placeholderResult.error || 'Failed to query candidates' });
    }

    const ids = (placeholderResult.data || []).map(row => row.id).filter(Boolean);

    if (dryRun || ids.length === 0) {
      return res.status(200).json({
        success: true,
        dryRun: true,
        placeholderCount: ids.length,
        ids,
        message: ids.length === 0 ? 'No placeholder candidates found' : 'Dry run only - pass dryRun:false to delete',
      });
    }

    let deleted = 0;

    if (isMySQL) {
      // Batched IN deletes for MySQL
      const BATCH_SIZE = 100;
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map(() => '?').join(',');
        const deleteResult = await query(`DELETE FROM candidates WHERE id IN (${placeholders})`, batch);
        if (!deleteResult.success) {
          return res.status(500).json({ success: false, error: deleteResult.error || 'Failed to delete placeholder candidates' });
        }
        deleted += batch.length;
      }
    } else {
      // Supabase adapter: delete one-by-one to satisfy WHERE requirement
      for (const id of ids) {
        const deleteResult = await query('DELETE FROM candidates WHERE id = ?', [id]);
        if (!deleteResult.success) {
          return res.status(500).json({ success: false, error: deleteResult.error || 'Failed to delete placeholder candidates' });
        }
        deleted += 1;
      }
    }

    return res.status(200).json({
      success: true,
      dryRun: false,
      deletedCount: deleted,
      ids,
      message: `Deleted ${deleted} placeholder candidate(s)`,
    });
  } catch (error) {
    console.error('[candidates/cleanup-placeholders] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unexpected error',
    });
  }
}
