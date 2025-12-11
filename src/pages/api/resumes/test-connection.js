import { createClient } from '@supabase/supabase-js';

// Test Supabase connection and Storage access
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const results = {
      timestamp: new Date().toISOString(),
      checks: [],
      errors: [],
    };

    // Check environment variables
    results.checks.push({
      type: 'environment_variables',
      supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
      anonKey: anonKey ? '✅ Set' : '❌ Missing',
      serviceRoleKey: serviceRoleKey ? '✅ Set' : '❌ Missing',
    });

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return res.status(400).json({
        success: false,
        error: 'Supabase credentials not fully configured',
        results,
      });
    }

    // Test 1: Create client with anon key (as per official docs)
    try {
      const supabaseAnon = createClient(supabaseUrl, anonKey);
      results.checks.push({
        type: 'anon_client',
        status: '✅ Created successfully',
      });
    } catch (err) {
      results.errors.push({
        type: 'anon_client_error',
        error: err.message,
      });
    }

    // Test 2: Create client with service role key (for Storage operations)
    try {
      const supabaseService = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
      });
      results.checks.push({
        type: 'service_client',
        status: '✅ Created successfully',
      });

      // Test 3: List files in resumes bucket
      try {
        const { data: files, error: listError } = await supabaseService.storage
          .from('resumes')
          .list('', {
            limit: 10,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (listError) {
          results.errors.push({
            type: 'storage_list_error',
            error: listError.message,
            code: listError.statusCode,
          });
        } else {
          results.checks.push({
            type: 'storage_access',
            status: '✅ Can access Storage',
            fileCount: files?.length || 0,
            sampleFiles: files?.slice(0, 5).map(f => ({
              name: f.name,
              size: f.metadata?.size,
              updated: f.updated_at,
            })) || [],
          });
        }
      } catch (storageErr) {
        results.errors.push({
          type: 'storage_test_error',
          error: storageErr.message,
        });
      }

      // Test 4: Check bucket permissions
      try {
        // Try to get public URL (tests read permissions)
        const { data: publicUrl, error: urlError } = await supabaseService.storage
          .from('resumes')
          .getPublicUrl('test');

        if (urlError) {
          results.errors.push({
            type: 'public_url_error',
            error: urlError.message,
          });
        } else {
          results.checks.push({
            type: 'storage_permissions',
            status: '✅ Can generate URLs',
            publicUrlTest: publicUrl?.publicUrl ? '✅ Works' : '❌ Failed',
          });
        }
      } catch (permErr) {
        results.errors.push({
          type: 'permissions_test_error',
          error: permErr.message,
        });
      }

    } catch (err) {
      results.errors.push({
        type: 'service_client_error',
        error: err.message,
      });
    }

    // Test 5: Database connection (via query function)
    try {
      const { query } = await import('@/lib/db');
      const testResult = await query('SELECT 1 as test');
      
      if (testResult.success) {
        results.checks.push({
          type: 'database_connection',
          status: '✅ Connected',
        });
      } else {
        results.errors.push({
          type: 'database_connection',
          error: testResult.error,
        });
      }
    } catch (dbErr) {
      results.errors.push({
        type: 'database_test_error',
        error: dbErr.message,
      });
    }

    const hasErrors = results.errors.length > 0;
    const allChecksPassed = results.checks.every(c => c.status?.includes('✅'));

    return res.status(hasErrors ? 500 : 200).json({
      success: !hasErrors && allChecksPassed,
      message: hasErrors 
        ? 'Some checks failed - see errors below'
        : 'All checks passed! Supabase connection is working.',
      results,
    });
  } catch (error) {
    console.error('[resumes/test-connection] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Connection test failed',
      details: error.message,
    });
  }
}

