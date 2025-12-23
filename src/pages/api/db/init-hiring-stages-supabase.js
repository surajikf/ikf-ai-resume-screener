// Supabase-specific initialization endpoint
// This uses the Supabase client directly to set up tables
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY; // Service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('[init-hiring-stages-supabase] Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const results = {
      current_stage_column: false,
      candidate_stages_table: false,
      initialized_candidates: 0,
    };

    // Note: Supabase doesn't allow ALTER TABLE through the client
    // Users must run the SQL migration manually in Supabase SQL Editor
    // This endpoint just checks if tables/columns exist

    // Check if current_stage column exists by trying to query it
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('current_stage')
        .limit(1);

      if (error) {
        if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
          results.current_stage_column = false;
        } else {
          throw error;
        }
      } else {
        results.current_stage_column = true;
      }
    } catch (err) {
      console.error('Error checking current_stage column:', err);
      results.current_stage_column = false;
    }

    // Check if candidate_stages table exists
    try {
      const { data, error } = await supabase
        .from('candidate_stages')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          results.candidate_stages_table = false;
        } else {
          // Table exists, just no data
          results.candidate_stages_table = true;
        }
      } else {
        results.candidate_stages_table = true;
      }
    } catch (err) {
      console.error('Error checking candidate_stages table:', err);
      results.candidate_stages_table = false;
    }

    // If column exists, initialize NULL values
    if (results.current_stage_column) {
      try {
        const { data, error } = await supabase
          .from('candidates')
          .update({ current_stage: 'Applied/Received' })
          .is('current_stage', null)
          .select('id');

        if (!error && data) {
          results.initialized_candidates = data.length;
        }
      } catch (err) {
        console.error('Error initializing candidates:', err);
      }
    }

    const allSetup = results.current_stage_column && results.candidate_stages_table;

    return res.status(200).json({
      success: allSetup,
      data: results,
      message: allSetup
        ? 'Hiring stages database is properly set up'
        : 'Database schema needs to be set up. Please run the migration script (database/migrations/supabase-hiring-stages.sql) in your Supabase SQL Editor.',
      needsMigration: !allSetup,
    });
  } catch (error) {
    console.error('Error checking hiring stages setup:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check hiring stages database setup',
    });
  }
}

