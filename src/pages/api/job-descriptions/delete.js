import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Support both query parameter and body
    const id = req.query.id || (req.body && req.body.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Job description ID is required',
      });
    }

    const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

    if (useSupabase) {
      // Handle Supabase delete explicitly (the generic query helper doesn't support DELETE fully)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({
          success: false,
          error: 'Supabase credentials not configured',
        });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase
        .from('job_descriptions')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    } else {
      const result = await query(
        'DELETE FROM job_descriptions WHERE id = ?',
        [id]
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Job description deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting job description:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete job description',
      details: error.message,
    });
  }
}

