import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[candidates/database] ========== NEW REQUEST ==========');
  console.log('[candidates/database] Request URL:', req.url);
  console.log('[candidates/database] Request Query:', req.query);

  try {
    const { 
      limit = 20, 
      offset = 0, 
      search, 
      verdict, // Will be undefined, "all", or a specific verdict
      sortBy = 'latest_evaluation',
      sortOrder = 'DESC',
      minExperience,
      maxExperience,
      minMatchScore,
      maxMatchScore,
      location,
      company,
      designation
    } = req.query;
    
    // Normalize verdict: treat undefined, null, empty string, or "all" as "show all"
    const verdictFilter = (verdict && verdict !== 'all' && verdict.trim() !== '') ? verdict.trim() : null;

    console.log('[candidates/database] ========== REQUEST START ==========');
    console.log('[candidates/database] Request received:', {
      limit,
      offset,
      search,
      verdict,
      verdictFilter, // Log the normalized filter
      sortBy,
      sortOrder,
    });

    // First, let's check if candidates table has any data and verify query function works
    try {
      const testQuery = await query('SELECT COUNT(*) as count FROM candidates');
      console.log('[candidates/database] Total candidates in database - Full result:', JSON.stringify(testQuery, null, 2));
      const candidateCount = testQuery.success ? (testQuery.data?.[0]?.count || testQuery.data?.[0]?.total || 0) : 0;
      console.log('[candidates/database] Parsed candidate count:', candidateCount);
      
      if (!testQuery || typeof testQuery !== 'object') {
        throw new Error('Query function returned invalid result: ' + typeof testQuery);
      }
      if (!testQuery.success && testQuery.error) {
        console.error('[candidates/database] Database connection test failed:', testQuery.error);
        return res.status(500).json({
          success: false,
          error: 'Database connection failed',
          details: testQuery.error,
        });
      }
    } catch (testErr) {
      console.error('[candidates/database] Error checking candidate count:', testErr);
      return res.status(500).json({
        success: false,
        error: 'Database connection test failed',
        details: testErr.message,
        stack: process.env.NODE_ENV === 'development' ? testErr.stack : undefined,
      });
    }

    // Step 1: Get all candidates with basic info
    // Note: We'll get evaluation stats separately to avoid subquery issues with Supabase
    // Use explicit column names (no aliases for Supabase compatibility)
    let candidatesSql = `
      SELECT 
        id,
        candidate_name,
        candidate_email,
        candidate_whatsapp,
        candidate_location,
        linkedin_url,
        current_designation,
        current_company,
        total_experience_years,
        number_of_companies,
        profile_summary,
        created_at,
        updated_at
      FROM candidates
    `;
    const candidatesParams = [];

    // Add search filter (will be applied in JavaScript for now)
    // This avoids SQL parsing issues with Supabase

    // Note: Verdict filter will be applied after fetching evaluation stats
    // This avoids subquery issues with Supabase

    // Note: Sorting and pagination will be done in JavaScript after fetching evaluation stats
    // This avoids subquery issues with Supabase

    console.log('[candidates/database] Executing query:', {
      sql: candidatesSql,
      paramsCount: candidatesParams.length,
    });

    let candidatesResult;
    try {
      console.log('[candidates/database] About to call query function...');
      candidatesResult = await query(candidatesSql, candidatesParams);
      console.log('[candidates/database] Query executed successfully');
      console.log('[candidates/database] Query result type:', typeof candidatesResult);
      console.log('[candidates/database] Query result keys:', candidatesResult ? Object.keys(candidatesResult) : 'null');
      console.log('[candidates/database] Query result success:', candidatesResult?.success);
      console.log('[candidates/database] Query result data type:', Array.isArray(candidatesResult?.data) ? 'array' : typeof candidatesResult?.data);
    } catch (queryError) {
      console.error('[candidates/database] ========== QUERY EXECUTION ERROR ==========');
      console.error('[candidates/database] Error message:', queryError.message);
      console.error('[candidates/database] Error name:', queryError.name);
      console.error('[candidates/database] Error stack:', queryError.stack);
      console.error('[candidates/database] ===========================================');
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: queryError.message,
        errorName: queryError.name,
        stack: process.env.NODE_ENV === 'development' ? queryError.stack : undefined,
      });
    }

    console.log('[candidates/database] Query result summary:', {
      hasResult: !!candidatesResult,
      success: candidatesResult?.success,
      dataLength: candidatesResult?.data?.length || 0,
      error: candidatesResult?.error,
      errorType: candidatesResult?.error ? typeof candidatesResult.error : 'none',
    });

    if (!candidatesResult) {
      console.error('[candidates/database] Query returned null/undefined');
      return res.status(500).json({
        success: false,
        error: 'Query returned no result',
        details: 'The database query did not return a result object',
      });
    }

    if (!candidatesResult.success) {
      console.error('[candidates/database] Query failed:', candidatesResult.error);
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false,
        },
        error: candidatesResult.error || 'Query failed',
      });
    }

    let candidates = [];
    try {
      candidates = Array.isArray(candidatesResult.data) ? candidatesResult.data : [];
      console.log('[candidates/database] ========== CANDIDATES FETCHED ==========');
      console.log('[candidates/database] Found candidates:', candidates.length);
      console.log('[candidates/database] Candidate IDs:', candidates.map(c => c.id || c.candidate_id));
      console.log('[candidates/database] Full candidates result:', {
        success: candidatesResult.success,
        dataType: typeof candidatesResult.data,
        isArray: Array.isArray(candidatesResult.data),
        dataLength: candidatesResult.data?.length,
        error: candidatesResult.error,
        firstCandidate: candidates[0] ? {
          id: candidates[0].id,
          name: candidates[0].candidate_name,
          email: candidates[0].candidate_email,
          allKeys: Object.keys(candidates[0]),
        } : null,
      });
      
      if (candidates.length > 0) {
        console.log('[candidates/database] Sample candidate:', {
          id: candidates[0].id,
          name: candidates[0].candidate_name,
          email: candidates[0].candidate_email,
          keys: Object.keys(candidates[0]),
        });
      } else {
        console.log('[candidates/database] ⚠️ No candidates found in database - this might indicate a problem if you just saved evaluations');
        console.log('[candidates/database] Raw query result:', JSON.stringify(candidatesResult, null, 2));
      }
    } catch (parseError) {
      console.error('[candidates/database] Error parsing candidates data:', parseError);
      candidates = [];
    }
    
    // Apply search filter in JavaScript if needed
    let filteredCandidates = candidates;
    try {
      console.log('[candidates/database] Before search filter - candidates count:', candidates.length);
      if (search) {
        const searchLower = search.toLowerCase();
        console.log('[candidates/database] Applying search filter:', searchLower);
        filteredCandidates = candidates.filter(c => {
          if (!c || typeof c !== 'object') return false;
          return (
            (c.candidate_name && String(c.candidate_name).toLowerCase().includes(searchLower)) ||
            (c.candidate_email && String(c.candidate_email).toLowerCase().includes(searchLower)) ||
            (c.candidate_whatsapp && String(c.candidate_whatsapp).includes(search)) ||
            (c.candidate_location && String(c.candidate_location).toLowerCase().includes(searchLower)) ||
            (c.current_designation && String(c.current_designation).toLowerCase().includes(searchLower)) ||
            (c.current_company && String(c.current_company).toLowerCase().includes(searchLower))
          );
        });
        console.log('[candidates/database] After search filter - filteredCandidates count:', filteredCandidates.length);
      } else {
        console.log('[candidates/database] No search filter - using all candidates');
      }
    } catch (filterError) {
      console.error('[candidates/database] Error filtering candidates:', filterError);
      filteredCandidates = candidates; // Fallback to unfiltered
    }
    console.log('[candidates/database] Final filteredCandidates count before evaluation stats:', filteredCandidates.length);

    // Step 1.5: Get evaluation stats for all candidates (latest date, count, and latest verdict)
    let evaluationStats = {};
    let latestEvaluations = {}; // Store latest evaluation for each candidate
    if (filteredCandidates.length > 0) {
      // Map candidates to use 'id' field (standard) or 'candidate_id' (if aliased)
      const candidateIds = filteredCandidates
        .map(c => c?.id || c?.candidate_id)
        .filter(id => id != null);
      
      if (candidateIds.length === 0) {
        console.warn('[candidates/database] No valid candidate IDs found');
      } else {
        console.log('[candidates/database] Fetching evaluations for', candidateIds.length, 'candidates');
        console.log('[candidates/database] Sample candidate IDs:', candidateIds.slice(0, 5));
        
        try {
          // For Supabase compatibility, we'll fetch evaluations in batches if there are too many IDs
          // Supabase has limits on IN clause size
          const BATCH_SIZE = 100;
          let allEvaluations = [];
          
          for (let i = 0; i < candidateIds.length; i += BATCH_SIZE) {
            const batch = candidateIds.slice(i, i + BATCH_SIZE);
            const placeholders = batch.map(() => '?').join(',');
            
            const allEvalsSql = `
              SELECT 
                candidate_id,
                id,
                verdict,
                match_score,
                created_at
              FROM evaluations
              WHERE candidate_id IN (${placeholders})
              ORDER BY created_at DESC
            `;
            
            console.log(`[candidates/database] Executing evaluations query batch ${Math.floor(i / BATCH_SIZE) + 1} with ${batch.length} IDs`);
            const batchResult = await query(allEvalsSql, batch);
            
            if (batchResult.success && Array.isArray(batchResult.data)) {
              allEvaluations = allEvaluations.concat(batchResult.data);
            } else {
              console.warn('[candidates/database] Batch query failed:', batchResult.error);
            }
          }
          
          const allEvalsResult = { success: true, data: allEvaluations };
          console.log('[candidates/database] Evaluations query result:', {
            success: allEvalsResult?.success,
            dataLength: allEvalsResult?.data?.length || 0,
            error: allEvalsResult?.error,
          });
          
          if (allEvalsResult.success && allEvalsResult.data && Array.isArray(allEvalsResult.data)) {
            // Calculate stats in JavaScript
            const statsByCandidate = {};
            console.log('[candidates/database] Processing evaluations for stats:', {
              totalEvaluations: allEvalsResult.data.length,
              sampleEvaluation: allEvalsResult.data[0] ? {
                id: allEvalsResult.data[0].id,
                candidate_id: allEvalsResult.data[0].candidate_id,
                candidate_id_type: typeof allEvalsResult.data[0].candidate_id,
                verdict: allEvalsResult.data[0].verdict,
                created_at: allEvalsResult.data[0].created_at,
              } : null,
            });
            
            allEvalsResult.data.forEach(evaluation => {
              if (!evaluation || evaluation.candidate_id == null) {
                console.warn('[candidates/database] Skipping evaluation with null candidate_id:', evaluation?.id);
                return;
              }
              
              // Ensure candidate_id is treated as string for consistent key usage
              const candidateId = String(evaluation.candidate_id);
              
              if (!statsByCandidate[candidateId]) {
                statsByCandidate[candidateId] = {
                  latest_evaluation_date: evaluation.created_at,
                  total_evaluations: 0,
                  latest_verdict: evaluation.verdict,
                  latest_match_score: evaluation.match_score || 0,
                };
              }
              
              statsByCandidate[candidateId].total_evaluations++;
              
              // Update latest if this evaluation is more recent
              // Since data is already sorted DESC, first one is latest, but check anyway for safety
              if (evaluation.created_at) {
                const currentLatest = new Date(statsByCandidate[candidateId].latest_evaluation_date);
                const evalDate = new Date(evaluation.created_at);
                if (evalDate > currentLatest) {
                  statsByCandidate[candidateId].latest_evaluation_date = evaluation.created_at;
                  statsByCandidate[candidateId].latest_verdict = evaluation.verdict;
                  statsByCandidate[candidateId].latest_match_score = evaluation.match_score || 0;
                }
              }
            });
            
            console.log('[candidates/database] Evaluation stats calculated:', {
              statsCount: Object.keys(statsByCandidate).length,
              statsKeys: Object.keys(statsByCandidate),
              statsDetails: Object.entries(statsByCandidate).map(([id, stats]) => ({
                candidateId: id,
                totalEvaluations: stats.total_evaluations,
                latestVerdict: stats.latest_verdict,
                latestDate: stats.latest_evaluation_date,
              })),
            });
            
            // Store stats
            Object.entries(statsByCandidate).forEach(([candidateId, stats]) => {
              evaluationStats[candidateId] = {
                latest_evaluation_date: stats.latest_evaluation_date,
                total_evaluations: stats.total_evaluations,
              };
              latestEvaluations[candidateId] = stats.latest_verdict;
            });
          } else {
            console.warn('[candidates/database] No evaluation data or invalid format:', {
              success: allEvalsResult.success,
              hasData: !!allEvalsResult.data,
              isArray: Array.isArray(allEvalsResult.data),
              error: allEvalsResult.error,
            });
          }
        } catch (statsErr) {
          console.error('[candidates/database] Error getting evaluation stats:', statsErr);
          // Continue without stats - candidates will show 0 evaluations
        }
      }
    }

    // Add evaluation stats to candidates
    let candidatesWithStats = [];
    try {
      console.log('[candidates/database] Before adding stats - filteredCandidates count:', filteredCandidates.length);
      console.log('[candidates/database] Evaluation stats keys:', Object.keys(evaluationStats));
      candidatesWithStats = filteredCandidates.map(c => {
        if (!c || typeof c !== 'object') {
          console.warn('[candidates/database] Invalid candidate object:', c);
          return null;
        }
        if (!c.id && !c.candidate_id) {
          console.warn('[candidates/database] Candidate missing ID:', c);
          return null;
        }
        const candidateId = String(c.id || c.candidate_id);
        const stats = evaluationStats[candidateId];
        const latestEval = latestEvaluations[candidateId];
        
        console.log('[candidates/database] Adding stats to candidate:', {
          candidateId,
          candidateName: c.candidate_name,
          hasStats: !!stats,
          stats: stats ? {
            totalEvaluations: stats.total_evaluations,
            latestDate: stats.latest_evaluation_date,
          } : null,
          latestVerdict: latestEval?.verdict || null,
        });
        
        return {
          ...c,
          candidate_id: candidateId, // Ensure consistent type
          id: candidateId, // Also set id for consistency
          latest_evaluation_date: stats?.latest_evaluation_date || null,
          total_evaluations: stats?.total_evaluations || 0,
          latest_verdict: latestEval?.verdict || null,
          latest_match_score: latestEval?.matchScore || stats?.latest_match_score || 0,
        };
      }).filter(c => c !== null); // Remove any null entries
      console.log('[candidates/database] After adding stats - candidatesWithStats count:', candidatesWithStats.length);
    } catch (mapError) {
      console.error('[candidates/database] Error mapping candidates with stats:', mapError);
      candidatesWithStats = filteredCandidates; // Fallback to candidates without stats
    }

    // Apply verdict filter in JavaScript (only if a specific verdict is requested)
    // If verdictFilter is null/undefined, show ALL candidates regardless of verdict
    try {
      if (verdictFilter) {
        console.log('[candidates/database] Applying verdict filter:', verdictFilter);
        const beforeCount = candidatesWithStats.length;
        candidatesWithStats = candidatesWithStats.filter(c => c && c.latest_verdict === verdictFilter);
        const afterCount = candidatesWithStats.length;
        console.log('[candidates/database] Verdict filter applied:', { beforeCount, afterCount, verdictFilter });
      } else {
        console.log('[candidates/database] No verdict filter - showing ALL candidates regardless of verdict status');
      }
    } catch (filterErr) {
      console.error('[candidates/database] Error applying verdict filter:', filterErr);
    }

    // Apply additional filters in JavaScript (after stats are added)
    try {
      // Experience range filter
      if (minExperience) {
        const minExp = parseFloat(minExperience);
        if (!isNaN(minExp)) {
          candidatesWithStats = candidatesWithStats.filter(c => {
            const exp = parseFloat(c.total_experience_years || 0);
            return exp >= minExp;
          });
        }
      }
      if (maxExperience) {
        const maxExp = parseFloat(maxExperience);
        if (!isNaN(maxExp)) {
          candidatesWithStats = candidatesWithStats.filter(c => {
            const exp = parseFloat(c.total_experience_years || 0);
            return exp <= maxExp;
          });
        }
      }

      // Location filter
      if (location && location.trim()) {
        const locationLower = location.toLowerCase().trim();
        candidatesWithStats = candidatesWithStats.filter(c => {
          const candidateLocation = (c.candidate_location || '').toLowerCase();
          return candidateLocation.includes(locationLower);
        });
      }

      // Company filter
      if (company && company.trim()) {
        const companyLower = company.toLowerCase().trim();
        candidatesWithStats = candidatesWithStats.filter(c => {
          const candidateCompany = (c.current_company || '').toLowerCase();
          return candidateCompany.includes(companyLower);
        });
      }

      // Designation filter
      if (designation && designation.trim()) {
        const designationLower = designation.toLowerCase().trim();
        candidatesWithStats = candidatesWithStats.filter(c => {
          const candidateDesignation = (c.current_designation || '').toLowerCase();
          return candidateDesignation.includes(designationLower);
        });
      }

      // Match score filter (applied after stats are added)
      if (minMatchScore) {
        const minScore = parseFloat(minMatchScore);
        if (!isNaN(minScore)) {
          candidatesWithStats = candidatesWithStats.filter(c => {
            const score = parseFloat(c.latest_match_score || 0);
            return score >= minScore;
          });
        }
      }
      if (maxMatchScore) {
        const maxScore = parseFloat(maxMatchScore);
        if (!isNaN(maxScore)) {
          candidatesWithStats = candidatesWithStats.filter(c => {
            const score = parseFloat(c.latest_match_score || 0);
            return score <= maxScore;
          });
        }
      }
    } catch (filterErr) {
      console.error('[candidates/database] Error applying additional filters:', filterErr);
    }

    // Define sorting variables
    const validSortBy = [
      'candidate_id', 
      'candidate_name', 
      'candidate_email',
      'current_designation',
      'total_experience_years',
      'latest_evaluation', 
      'total_evaluations', 
      'candidate_created_at', 
      'created_at'
    ];
    const sortColumn = validSortBy.includes(sortBy) ? sortBy : 'latest_evaluation';
    const validSortOrder = ['ASC', 'DESC'];
    const order = validSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Apply sorting after getting stats
    try {
      if (sortColumn === 'candidate_id') {
        candidatesWithStats.sort((a, b) => {
          const idA = parseInt(a.id || a.candidate_id || 0);
          const idB = parseInt(b.id || b.candidate_id || 0);
          return order === 'DESC' ? idB - idA : idA - idB;
        });
      } else if (sortColumn === 'candidate_name') {
        candidatesWithStats.sort((a, b) => {
          const nameA = (a.candidate_name || '').toLowerCase();
          const nameB = (b.candidate_name || '').toLowerCase();
          const diff = nameA.localeCompare(nameB);
          return order === 'DESC' ? -diff : diff;
        });
      } else if (sortColumn === 'candidate_email') {
        candidatesWithStats.sort((a, b) => {
          const emailA = (a.candidate_email || '').toLowerCase();
          const emailB = (b.candidate_email || '').toLowerCase();
          const diff = emailA.localeCompare(emailB);
          return order === 'DESC' ? -diff : diff;
        });
      } else if (sortColumn === 'current_designation') {
        candidatesWithStats.sort((a, b) => {
          const desigA = (a.current_designation || '').toLowerCase();
          const desigB = (b.current_designation || '').toLowerCase();
          const diff = desigA.localeCompare(desigB);
          return order === 'DESC' ? -diff : diff;
        });
      } else if (sortColumn === 'total_experience_years') {
        candidatesWithStats.sort((a, b) => {
          const expA = parseFloat(a.total_experience_years || 0);
          const expB = parseFloat(b.total_experience_years || 0);
          return order === 'DESC' ? expB - expA : expA - expB;
        });
      } else if (sortColumn === 'latest_evaluation') {
        candidatesWithStats.sort((a, b) => {
          const aDate = a.latest_evaluation_date ? new Date(a.latest_evaluation_date).getTime() : 0;
          const bDate = b.latest_evaluation_date ? new Date(b.latest_evaluation_date).getTime() : 0;
          if (order === 'DESC') {
            // Put NULLs last
            if (!a.latest_evaluation_date && !b.latest_evaluation_date) return 0;
            if (!a.latest_evaluation_date) return 1;
            if (!b.latest_evaluation_date) return -1;
            return bDate - aDate;
          } else {
            // Put NULLs first
            if (!a.latest_evaluation_date && !b.latest_evaluation_date) return 0;
            if (!a.latest_evaluation_date) return -1;
            if (!b.latest_evaluation_date) return 1;
            return aDate - bDate;
          }
        });
      } else if (sortColumn === 'total_evaluations') {
        candidatesWithStats.sort((a, b) => {
          const diff = a.total_evaluations - b.total_evaluations;
          return order === 'DESC' ? -diff : diff;
        });
      } else if (sortColumn === 'candidate_created_at' || sortColumn === 'created_at') {
        candidatesWithStats.sort((a, b) => {
          // Handle both created_at and candidate_created_at field names
          const dateA = (a.created_at || a.candidate_created_at) ? new Date(a.created_at || a.candidate_created_at).getTime() : 0;
          const dateB = (b.created_at || b.candidate_created_at) ? new Date(b.created_at || b.candidate_created_at).getTime() : 0;
          return order === 'DESC' ? dateB - dateA : dateA - dateB;
        });
      } else {
        // Default sort by created_at
        candidatesWithStats.sort((a, b) => {
          const dateA = (a.created_at || a.candidate_created_at) ? new Date(a.created_at || a.candidate_created_at).getTime() : 0;
          const dateB = (b.created_at || b.candidate_created_at) ? new Date(b.created_at || b.candidate_created_at).getTime() : 0;
          return order === 'DESC' ? dateB - dateA : dateA - dateB;
        });
      }
    } catch (sortErr) {
      console.error('[candidates/database] Error sorting candidates:', sortErr);
      // Continue without sorting
    }

    // Apply pagination after sorting
    let paginatedCandidates = [];
    try {
      console.log('[candidates/database] Before pagination - candidatesWithStats count:', candidatesWithStats.length, 'offset:', offset, 'limit:', limit);
      const offsetNum = parseInt(offset) || 0;
      const limitNum = parseInt(limit) || 20;
      paginatedCandidates = candidatesWithStats.slice(
        offsetNum,
        offsetNum + limitNum
      );
      console.log('[candidates/database] After pagination - paginatedCandidates count:', paginatedCandidates.length, 'out of', candidatesWithStats.length, 'total candidates');
    } catch (pageErr) {
      console.error('[candidates/database] Error paginating:', pageErr);
      paginatedCandidates = candidatesWithStats.slice(0, parseInt(limit) || 20);
    }

    // Calculate total count (after filtering, BEFORE pagination)
    const totalCount = candidatesWithStats.length;
    console.log('[candidates/database] Total count after all processing (before pagination):', totalCount);
    console.log('[candidates/database] Pagination info:', {
      total: totalCount,
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || 20,
      showing: paginatedCandidates.length,
      hasMore: (parseInt(offset) || 0) + paginatedCandidates.length < totalCount,
    });
    
    if (paginatedCandidates.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false,
        },
      });
    }

    // Step 2: Get all evaluations for these candidates
    const candidateIds = paginatedCandidates
      .map(c => {
        // Handle both id and candidate_id fields
        const id = c?.candidate_id || c?.id;
        return id != null ? String(id) : null;
      })
      .filter(id => id != null); // Filter out null/undefined IDs
    
    console.log('[candidates/database] Processing candidates:', {
      candidateCount: paginatedCandidates.length,
      candidateIds: candidateIds.slice(0, 5), // Log first 5 IDs
    });
    
    let evaluationsResult = { success: true, data: [] };
    let resumesResult = { success: true, data: [] };
    
    if (candidateIds.length > 0) {
      try {
        // Batch the query if there are too many candidate IDs (Supabase might have limits)
        const BATCH_SIZE = 100;
        let allEvaluations = [];
        
        for (let i = 0; i < candidateIds.length; i += BATCH_SIZE) {
          const batch = candidateIds.slice(i, i + BATCH_SIZE);
          const placeholders = batch.map(() => '?').join(',');

          const evaluationsSql = `
          SELECT 
            e.id as evaluation_id,
            e.candidate_id,
            e.job_description_id,
            e.role_applied,
            e.company_location,
            e.experience_ctc_notice_location,
            e.work_experience,
            e.verdict,
            e.match_score,
            e.score_breakdown,
            e.key_strengths,
            e.gaps,
            e.education_gaps,
            e.experience_gaps,
            e.better_suited_focus,
            e.email_draft,
            e.whatsapp_draft,
            e.created_at,
            e.updated_at,
            jd.id as jd_id,
            jd.title as jd_title,
            jd.description as jd_description,
            jd.jd_link as jd_link,
            jd.created_at as jd_created_at
          FROM evaluations e
          LEFT JOIN job_descriptions jd ON e.job_description_id = jd.id
          WHERE e.candidate_id IN (${placeholders})
          ORDER BY e.created_at DESC
        `;

          console.log(`[candidates/database] Executing evaluations JOIN query batch ${Math.floor(i / BATCH_SIZE) + 1} with ${batch.length} IDs`);
          const batchResult = await query(evaluationsSql, batch);
          
          if (batchResult.success && Array.isArray(batchResult.data)) {
            allEvaluations = allEvaluations.concat(batchResult.data);
          } else {
            console.warn('[candidates/database] Evaluations JOIN batch query failed:', batchResult.error);
          }
        }
        
        evaluationsResult = { success: true, data: allEvaluations };

        // Step 3: Get resume metadata for evaluations
        const evaluationIds = evaluationsResult.success && evaluationsResult.data 
          ? evaluationsResult.data.map(e => e.evaluation_id).filter(id => id != null)
          : [];

        if (evaluationIds.length > 0) {
          try {
            const resumePlaceholders = evaluationIds.map(() => '?').join(',');
            const resumesSql = `
              SELECT 
                r.evaluation_id,
                r.file_name,
                r.file_type,
                r.file_size,
                r.file_path
              FROM resumes r
              WHERE r.evaluation_id IN (${resumePlaceholders})
            `;
            resumesResult = await query(resumesSql, evaluationIds);
          } catch (resumeErr) {
            console.error('[candidates/database] Error fetching resumes:', resumeErr);
            resumesResult = { success: false, data: [], error: resumeErr.message };
          }
        }
      } catch (evalErr) {
        console.error('[candidates/database] Error fetching evaluations:', evalErr);
        evaluationsResult = { success: false, data: [], error: evalErr.message };
      }
    }

    // Step 4: Combine data
    const evaluationsByCandidate = {};
    if (evaluationsResult.success && evaluationsResult.data && Array.isArray(evaluationsResult.data)) {
      evaluationsResult.data.forEach(evaluation => {
        if (!evaluation || !evaluation.candidate_id) return;
        const candidateId = String(evaluation.candidate_id); // Ensure consistent type
        if (!evaluationsByCandidate[candidateId]) {
          evaluationsByCandidate[candidateId] = [];
        }

        // Find resume for this evaluation
        const resume = resumesResult.success && resumesResult.data
          ? resumesResult.data.find(r => r.evaluation_id === evaluation.evaluation_id)
          : null;

        // Helper function to safely parse JSON
        const safeParseJSON = (str, defaultValue) => {
          if (!str) return defaultValue;
          // If it's already an object/array, return it as-is
          if (typeof str === 'object' && str !== null) {
            return str;
          }
          // If it's not a string, try to convert it
          if (typeof str !== 'string') {
            try {
              str = String(str);
            } catch (e) {
              return defaultValue;
            }
          }
          try {
            return JSON.parse(str);
          } catch (e) {
            const preview = typeof str === 'string' ? str.substring(0, 50) : String(str).substring(0, 50);
            console.warn('[candidates/database] JSON parse error:', e.message, 'for:', preview);
            return defaultValue;
          }
        };

        evaluationsByCandidate[candidateId].push({
          evaluationId: evaluation.evaluation_id,
          roleApplied: evaluation.role_applied,
          companyLocation: evaluation.company_location,
          experienceCtcNoticeLocation: evaluation.experience_ctc_notice_location,
          workExperience: safeParseJSON(evaluation.work_experience, []),
          verdict: evaluation.verdict,
          matchScore: evaluation.match_score,
          scoreBreakdown: safeParseJSON(evaluation.score_breakdown, {}),
          keyStrengths: safeParseJSON(evaluation.key_strengths, []),
          gaps: safeParseJSON(evaluation.gaps, []),
          educationGaps: safeParseJSON(evaluation.education_gaps, []),
          experienceGaps: safeParseJSON(evaluation.experience_gaps, []),
          betterSuitedFocus: evaluation.better_suited_focus,
          emailDraft: safeParseJSON(evaluation.email_draft, {}),
          whatsappDraft: safeParseJSON(evaluation.whatsapp_draft, {}),
          createdAt: evaluation.created_at,
          updatedAt: evaluation.updated_at,
          jobDescription: evaluation.jd_id ? {
            id: evaluation.jd_id,
            title: evaluation.jd_title,
            description: evaluation.jd_description,
            link: evaluation.jd_link,
            createdAt: evaluation.jd_created_at,
          } : null,
          hasResume: !!resume,
          resume: resume ? {
            fileName: resume.file_name,
            fileType: resume.file_type,
            fileSize: resume.file_size,
            filePath: resume.file_path,
          } : null,
        });
      });
    }

    // Step 5: Build final response
    let formattedCandidates = [];
    try {
      formattedCandidates = paginatedCandidates
        .filter(candidate => {
          if (!candidate) return false;
          if (!candidate.candidate_id && !candidate.id) return false;
          return true;
        })
        .map(candidate => {
          try {
            const candidateId = String(candidate.candidate_id || candidate.id); // Ensure consistent type
            const evaluations = evaluationsByCandidate[candidateId] || [];
          
            // Get latest evaluation for quick access
            const latestEvaluation = evaluations.length > 0 ? evaluations[0] : null;

            return {
              candidateId: candidateId,
              candidateName: candidate.candidate_name || 'Unknown Candidate',
              candidateEmail: candidate.candidate_email || null,
              candidateWhatsApp: candidate.candidate_whatsapp || null,
              candidateLocation: candidate.candidate_location || null,
              linkedInUrl: candidate.linkedin_url || '',
              currentDesignation: candidate.current_designation || null,
              currentCompany: candidate.current_company || null,
              totalExperienceYears: candidate.total_experience_years || null,
              numberOfCompanies: candidate.number_of_companies || null,
              profileSummary: candidate.profile_summary || null,
              candidateCreatedAt: candidate.created_at || candidate.candidate_created_at || null,
              candidateUpdatedAt: candidate.updated_at || candidate.candidate_updated_at || null,
              evaluations: evaluations,
              totalEvaluations: parseInt(candidate.total_evaluations) || 0,
              latestEvaluationDate: candidate.latest_evaluation_date || null,
              latestEvaluation: latestEvaluation,
            };
          } catch (mapErr) {
            console.error('[candidates/database] Error mapping candidate:', mapErr, candidate);
            return null;
          }
        })
        .filter(c => c !== null); // Remove any null entries from mapping errors
    } catch (formatErr) {
      console.error('[candidates/database] Error formatting candidates:', formatErr);
      formattedCandidates = [];
    }

    // Total count is already calculated (candidatesWithStats.length after filtering)
    const total = totalCount;

    console.log('[candidates/database] ========== FINAL RESPONSE SUMMARY ==========');
    console.log('[candidates/database] Final response summary:', {
      formattedCandidatesCount: formattedCandidates.length,
      totalCount,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + formattedCandidates.length < total,
      },
      sampleCandidate: formattedCandidates[0] ? {
        candidateId: formattedCandidates[0].candidateId,
        candidateName: formattedCandidates[0].candidateName,
        totalEvaluations: formattedCandidates[0].totalEvaluations,
        hasEvaluations: formattedCandidates[0].evaluations?.length > 0,
        latestVerdict: formattedCandidates[0].latestEvaluation?.verdict || 'No evaluations',
      } : null,
      allCandidateIds: formattedCandidates.map(c => c.candidateId),
      allCandidateNames: formattedCandidates.map(c => c.candidateName),
    });
    console.log('[candidates/database] ===========================================');

    return res.status(200).json({
      success: true,
      data: formattedCandidates,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + formattedCandidates.length < total,
      },
    });
  } catch (error) {
    console.error('[candidates/database] ========== UNHANDLED ERROR ==========');
    console.error('[candidates/database] Error Message:', error.message);
    console.error('[candidates/database] Error Name:', error.name);
    console.error('[candidates/database] Error Stack:', error.stack);
    console.error('[candidates/database] Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('[candidates/database] ====================================');
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch candidates database',
      details: error.message || 'Unknown error',
      errorName: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

