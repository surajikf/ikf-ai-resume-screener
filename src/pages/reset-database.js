import { useState } from 'react';
import Head from 'next/head';

export default function ResetDatabase() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);

  const fetchPreview = async () => {
    try {
      const response = await fetch('/api/candidates/reset-database');
      const data = await response.json();
      setPreview(data);
    } catch (error) {
      console.error('Error fetching preview:', error);
    }
  };

  const handleReset = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE ALL candidates, evaluations, and resumes!\n\nThis action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    if (!confirm('⚠️ FINAL CONFIRMATION: This will permanently delete ALL data. Type OK to confirm.')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/candidates/reset-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: true }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Database - Resume Screener</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-red-600 mb-6">Reset Database</h1>
          
          <div className="space-y-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-2">⚠️ WARNING</p>
              <p className="text-red-700">
                This will permanently delete ALL candidates, evaluations, and resumes from the database.
                This action cannot be undone!
              </p>
            </div>

            <button
              onClick={fetchPreview}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Preview Current Data
            </button>

            {preview && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Current Database Contents:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Candidates: {preview.currentData?.candidates || 0}</li>
                  <li>Evaluations: {preview.currentData?.evaluations || 0}</li>
                  <li>Resumes: {preview.currentData?.resumes || 0}</li>
                </ul>
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'DELETE ALL DATA'}
            </button>
          </div>

          {result && (
            <div className={`border rounded-lg p-4 ${
              result.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="font-semibold mb-2">
                {result.success ? '✅ Success' : '❌ Error'}
              </p>
              <p>{result.message || result.error}</p>
              {result.deleted && (
                <div className="mt-2">
                  <p className="text-sm">Deleted:</p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Candidates: {result.deleted.candidates}</li>
                    <li>Evaluations: {result.deleted.evaluations}</li>
                    <li>Resumes: {result.deleted.resumes}</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200">
            <Link
              href="/candidate-database"
              className="text-blue-600 hover:underline"
            >
              ← Back to Candidate Database
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

