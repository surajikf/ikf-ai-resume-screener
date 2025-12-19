import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      limit = 20, 
      offset = 0, 
      search, 
      verdict,
      sortBy = 'latest_evaluation',
      sortOrder = 'DESC'
    } = req.query;

    console.log('[candidates/database-minimal] Request received');

    // Step 1: Get all candidates
    const candidatesResult = await query('SELECT * FROM candidates');
    
    if (!candidatesResult || !candidatesResult.success) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, limit: parseInt(limit), offset: parseInt(offset), hasMore: false },
      });
    }

    let candidates = Array.isArray(candidatesResult.data) ? candidatesResult.data : [];
    console.log('[candidates/database-minimal] Found', candidates.length, 'candidates');

    // Step 2: Get evaluations for all candidates
    let evaluationsResult = { success: true, data: [] };
    if (candidates.length > 0) {
      const candidateIds = candidates.map(c => c.id || c.candidate_id).filter(id => id != null);
      if (candidateIds.length > 0) {
        const placeholders = candidateIds.map(() => '?').join(',');
        evaluationsResult = await query(
          `SELECT candidate_id, id, verdict, created_at FROM evaluations WHERE candidate_id IN (${placeholders})`,
          candidateIds
        );
      }
    }

    // Step 3: Calculate stats
    const statsByCandidate = {};
    if (evaluationsResult.success && Array.isArray(evaluationsResult.data)) {
      evaluationsResult.data.forEach(evaluation => {
        const cid = String(evaluation.candidate_id);
        if (!statsByCandidate[cid]) {
          statsByCandidate[cid] = { count: 0, latest: null, latestVerdict: null };
        }
        statsByCandidate[cid].count++;
        if (!statsByCandidate[cid].latest || new Date(evaluation.created_at) > new Date(statsByCandidate[cid].latest)) {
          statsByCandidate[cid].latest = evaluation.created_at;
          statsByCandidate[cid].latestVerdict = evaluation.verdict;
        }
      });
    }

    // Step 4: Format response
    const formatted = candidates.map(c => {
      const cid = String(c.id || c.candidate_id);
      const stats = statsByCandidate[cid] || { count: 0, latest: null, latestVerdict: null };
      
      // Apply verdict filter
      if (verdict && verdict !== 'all' && stats.latestVerdict !== verdict) {
        return null;
      }
      
      return {
        candidateId: cid,
        candidateName: c.candidate_name || 'Unknown',
        candidateEmail: c.candidate_email,
        candidateWhatsApp: c.candidate_whatsapp,
        candidateLocation: c.candidate_location,
        linkedInUrl: c.linkedin_url || '',
        currentDesignation: c.current_designation,
        currentCompany: c.current_company,
        totalExperienceYears: c.total_experience_years,
        numberOfCompanies: c.number_of_companies,
        profileSummary: c.profile_summary,
        candidateCreatedAt: c.created_at,
        candidateUpdatedAt: c.updated_at,
        evaluations: [],
        totalEvaluations: stats.count,
        latestEvaluationDate: stats.latest,
        latestEvaluation: null,
      };
    }).filter(c => c !== null);

    // Apply search filter
    let filtered = formatted;
    if (search) {
      const s = search.toLowerCase();
      filtered = formatted.filter(c => 
        (c.candidateName && c.candidateName.toLowerCase().includes(s)) ||
        (c.candidateEmail && c.candidateEmail.toLowerCase().includes(s))
      );
    }

    // Apply sorting
    if (sortBy === 'latest_evaluation') {
      filtered.sort((a, b) => {
        const aDate = a.latestEvaluationDate ? new Date(a.latestEvaluationDate).getTime() : 0;
        const bDate = b.latestEvaluationDate ? new Date(b.latestEvaluationDate).getTime() : 0;
        return sortOrder === 'DESC' ? bDate - aDate : aDate - bDate;
      });
    }

    // Apply pagination
    const paginated = filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total: filtered.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + paginated.length < filtered.length,
      },
    });
  } catch (error) {
    console.error('[candidates/database-minimal] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

