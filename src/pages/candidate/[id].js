import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CandidateProfile from '@/components/CandidateProfile';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CandidateProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchCandidate = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize database tables if needed (silent - don't fail if it doesn't work)
        // The endpoint will automatically detect MySQL vs Supabase
        try {
          const initResponse = await fetch('/api/db/init-hiring-stages', { method: 'POST' });
          if (initResponse.ok) {
            const initData = await initResponse.json();
            if (initData.needsMigration) {
              console.warn('Hiring stages migration needed:', initData.message);
            }
          } else {
            // If it fails, that's okay - migration might already be done
            console.warn('Init endpoint returned non-OK status, but continuing...');
          }
        } catch (initErr) {
          // Silently fail - migration might already be done or endpoint might not exist
          console.warn('Could not check hiring stages setup (this is usually fine):', initErr.message);
        }

        const response = await fetch(`/api/candidates/${id}`);
        
        // Check if response is ok before parsing JSON
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            throw new Error(`Server error (${response.status}): ${errorText.substring(0, 200)}`);
          }
          throw new Error(errorData.error || `Server error (${response.status})`);
        }
        
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch candidate data');
        }

        setCandidate(data.data);
      } catch (err) {
        console.error('Error fetching candidate:', err);
        setError(err.message || 'Failed to load candidate profile');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [id]);

  const handleStageUpdate = async (newStage, comment, evaluationId) => {
    try {
      const response = await fetch(`/api/candidates/${id}/stages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: newStage,
          comment: comment || '',
          evaluationId: evaluationId || null,
          changedBy: 'HR User', // TODO: Get from auth/session
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Server error (${response.status}): ${errorText.substring(0, 200)}`);
        }
        throw new Error(errorData.error || `Failed to update stage (${response.status})`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update stage');
      }

      // Refresh candidate data to get updated stage history from database
      try {
        const refreshResponse = await fetch(`/api/candidates/${id}`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success) {
            setCandidate(refreshData.data);
            return true;
          }
        }
      } catch (refreshErr) {
        console.warn('Could not refresh candidate data, using local update:', refreshErr);
      }

      // Fallback: Update local state if refresh fails
      setCandidate((prev) => ({
        ...prev,
        currentStage: newStage,
        stageHistory: [
          {
            id: Date.now(),
            candidateId: parseInt(id),
            evaluationId: evaluationId || null,
            stage: newStage,
            comment: comment || null,
            changedBy: 'HR User',
            createdAt: new Date().toISOString(),
          },
          ...(prev.stageHistory || []),
        ],
      }));

      return true;
    } catch (err) {
      console.error('Error updating stage:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Candidate Profile...</title>
        </Head>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Error - Candidate Profile</title>
        </Head>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
            <h1 className="text-xl font-semibold text-red-900 mb-2">Error Loading Candidate</h1>
            <p className="text-red-700 mb-4">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!candidate) {
    return (
      <>
        <Head>
          <title>Candidate Not Found</title>
        </Head>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 max-w-md w-full">
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Candidate Not Found</h1>
            <p className="text-slate-700 mb-4">The candidate you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{candidate.candidateName} - Candidate Profile</title>
      </Head>
      <CandidateProfile candidate={candidate} onStageUpdate={handleStageUpdate} />
    </>
  );
}

