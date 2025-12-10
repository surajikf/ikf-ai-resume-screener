/**
 * Utility to sync localStorage data to Supabase
 * Ensures all local data is backed up to the database
 */

/**
 * Sync evaluations from localStorage to Supabase
 * Only syncs evaluations that don't have a databaseId
 */
export const syncEvaluationsToSupabase = async () => {
  if (typeof window === 'undefined') return { success: false, error: 'Not in browser' };

  try {
    const { getEvaluations } = await import('@/utils/evaluationStorage');
    const evaluations = getEvaluations();

    if (!evaluations || evaluations.length === 0) {
      return { success: true, synced: 0, message: 'No evaluations to sync' };
    }

    // Filter out evaluations that are already synced
    const unsyncedEvaluations = evaluations.filter(
      evaluation => !evaluation.databaseId && !evaluation.id?.toString().startsWith('loading-')
    );

    if (unsyncedEvaluations.length === 0) {
      return { success: true, synced: 0, skipped: evaluations.length, message: 'All evaluations already synced' };
    }

    // Call sync API
    const response = await fetch('/api/evaluations/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evaluations: unsyncedEvaluations }),
    });

    const data = await response.json();

    if (data.success) {
      // After successful sync, reload evaluations from database to get databaseIds
      // This will update localStorage with the new databaseIds
      return {
        success: true,
        synced: data.synced || 0,
        skipped: data.skipped || 0,
        errors: data.errors,
        message: data.message,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Sync failed',
        message: data.message,
      };
    }
  } catch (error) {
    console.error('Error syncing evaluations to Supabase:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
};

/**
 * Sync job descriptions from localStorage to Supabase
 */
export const syncJobDescriptionsToSupabase = async () => {
  if (typeof window === 'undefined') return { success: false, error: 'Not in browser' };

  try {
    const { getJDs } = await import('@/utils/jdStorage');
    const jds = getJDs();

    if (!jds || jds.length === 0) {
      return { success: true, synced: 0, message: 'No job descriptions to sync' };
    }

    let syncedCount = 0;
    const errors = [];

    // Sync each JD that doesn't have an ID (not in database)
    for (const jd of jds) {
      if (jd.id) {
        continue; // Already in database
      }

      try {
        const response = await fetch('/api/job-descriptions/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: jd.title,
            description: jd.content,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.id) {
            syncedCount++;
            // Update localStorage with database ID
            const updatedJDs = jds.map(j => 
              j.title === jd.title ? { ...j, id: data.data.id } : j
            );
            localStorage.setItem('savedJDs', JSON.stringify(updatedJDs));
          }
        }
      } catch (error) {
        console.error(`Error syncing JD "${jd.title}":`, error);
        errors.push({ title: jd.title, error: error.message });
      }
    }

    return {
      success: true,
      synced: syncedCount,
      skipped: jds.length - syncedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Synced ${syncedCount} job description(s)`,
    };
  } catch (error) {
    console.error('Error syncing job descriptions to Supabase:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
};

/**
 * Sync all localStorage data to Supabase
 * Runs both evaluations and job descriptions sync
 */
export const syncAllToSupabase = async () => {
  const results = {
    evaluations: await syncEvaluationsToSupabase(),
    jobDescriptions: await syncJobDescriptionsToSupabase(),
  };

  return {
    success: results.evaluations.success && results.jobDescriptions.success,
    results,
    totalSynced: (results.evaluations.synced || 0) + (results.jobDescriptions.synced || 0),
  };
};

