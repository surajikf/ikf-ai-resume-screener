import { query } from '@/lib/db';

/**
 * DELETE ALL job descriptions from database
 * WARNING: This will delete ALL job descriptions. Use with caution!
 * This is primarily for testing purposes.
 */
export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
    
    if (useSupabase) {
      // For Supabase, we need to use the Supabase client directly
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
      
      // Delete all job descriptions using Supabase
      // First, get all IDs to delete
      const { data: allJDs, error: fetchError } = await supabase
        .from('job_descriptions')
        .select('id');
      
      if (fetchError) {
        return res.status(500).json({
          success: false,
          error: fetchError.message,
        });
      }
      
      if (!allJDs || allJDs.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No job descriptions to delete',
          data: {
            remainingCount: 0,
          },
        });
      }
      
      // Delete all rows by ID
      const ids = allJDs.map(jd => jd.id);
      const { error } = await supabase
        .from('job_descriptions')
        .delete()
        .in('id', ids);
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }
      
      // Get remaining count
      const { count } = await supabase
        .from('job_descriptions')
        .select('*', { count: 'exact', head: true });
      
      return res.status(200).json({
        success: true,
        message: 'All job descriptions deleted successfully',
        data: {
          remainingCount: count || 0,
        },
      });
    } else {
      // For MySQL, use the query function
      const result = await query(
        'DELETE FROM job_descriptions',
        []
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      // Get count of remaining rows
      const countResult = await query(
        'SELECT COUNT(*) as count FROM job_descriptions',
        []
      );
      
      const remainingCount = countResult.success && countResult.data?.[0]?.count ? countResult.data[0].count : 0;

      return res.status(200).json({
        success: true,
        message: 'All job descriptions deleted successfully',
        data: {
          remainingCount,
        },
      });
    }
  } catch (error) {
    console.error('Error deleting all job descriptions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete all job descriptions',
      details: error.message,
    });
  }
}

