import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaTrash, FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

export default function DeleteAllData() {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const isConfirmed = confirmText === 'DELETE_ALL_DATA';

  const handleDelete = async () => {
    if (!isConfirmed) {
      setError('Please type DELETE_ALL_DATA to confirm');
      return;
    }

    // Final confirmation
    if (!confirm('⚠️ FINAL WARNING: This will permanently delete ALL candidates and evaluations!\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/db/delete-all-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm: 'DELETE_ALL_DATA',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: 'All data deleted successfully',
          deletedCounts: data.deletedCounts,
          verification: data.verification,
        });
        setConfirmText(''); // Clear the input
      } else {
        setError(data.error || 'Failed to delete data');
        setResult({
          success: false,
          details: data,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
      setResult({
        success: false,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Delete All Data - Resume Screener</title>
        <meta name="description" content="Delete all candidates and evaluations from the database" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-blue-300 transition-colors"
                  title="Back to Home"
                >
                  <FaArrowLeft />
                  Back
                </Link>
                <FaTrash className="text-2xl text-red-600" />
                <h1 className="text-2xl font-bold text-slate-900">Delete All Data</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              {/* Warning Banner */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-semibold text-red-900 mb-2">
                      ⚠️ DANGER ZONE
                    </h2>
                    <p className="text-red-800 mb-2">
                      This action will <strong>permanently delete</strong> all data from the database:
                    </p>
                    <ul className="list-disc list-inside text-red-800 space-y-1 mb-3">
                      <li>All candidates</li>
                      <li>All evaluations</li>
                      <li>All email logs</li>
                      <li>All WhatsApp logs</li>
                      <li>All resumes</li>
                      <li>All candidate stages</li>
                    </ul>
                    <p className="text-red-900 font-semibold">
                      This action <strong>CANNOT be undone</strong>!
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmation Input */}
              <div className="mb-6">
                <label htmlFor="confirmInput" className="block text-sm font-semibold text-slate-700 mb-2">
                  To confirm deletion, type <code className="bg-slate-100 px-2 py-1 rounded text-red-600 font-mono">DELETE_ALL_DATA</code> below:
                </label>
                <input
                  id="confirmInput"
                  type="text"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                    setError(null);
                    setResult(null);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && isConfirmed && !loading) {
                      handleDelete();
                    }
                  }}
                  placeholder="Type DELETE_ALL_DATA to confirm"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-mono transition-colors"
                  disabled={loading}
                  autoComplete="off"
                />
                {confirmText && !isConfirmed && (
                  <p className="mt-2 text-sm text-slate-500">
                    Current input: <code className="bg-slate-100 px-1 py-0.5 rounded">{confirmText}</code>
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <FaTimesCircle />
                    <span className="font-semibold">{error}</span>
                  </div>
                </div>
              )}

              {/* Delete Button */}
              <button
                onClick={handleDelete}
                disabled={!isConfirmed || loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                  isConfirmed && !loading
                    ? 'bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg'
                    : 'bg-slate-400 cursor-not-allowed'
                } flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Deleting Data...
                  </>
                ) : (
                  <>
                    <FaTrash />
                    Delete All Data
                  </>
                )}
              </button>

              {/* Success Result */}
              {result && result.success && (
                <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <FaCheckCircle className="text-green-600 text-2xl flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900 mb-2">
                        ✅ Success! All data deleted.
                      </h3>
                      <p className="text-green-800">{result.message}</p>
                    </div>
                  </div>

                  {result.deletedCounts && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-green-900 mb-2">Deleted Counts:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-white rounded p-2 border border-green-200">
                          <div className="text-xs text-slate-500">Candidates</div>
                          <div className="text-lg font-bold text-green-700">
                            {result.deletedCounts.candidates || 0}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2 border border-green-200">
                          <div className="text-xs text-slate-500">Evaluations</div>
                          <div className="text-lg font-bold text-green-700">
                            {result.deletedCounts.evaluations || 0}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2 border border-green-200">
                          <div className="text-xs text-slate-500">Email Logs</div>
                          <div className="text-lg font-bold text-green-700">
                            {result.deletedCounts.emailLogs || 0}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2 border border-green-200">
                          <div className="text-xs text-slate-500">WhatsApp Logs</div>
                          <div className="text-lg font-bold text-green-700">
                            {result.deletedCounts.whatsappLogs || 0}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2 border border-green-200">
                          <div className="text-xs text-slate-500">Resumes</div>
                          <div className="text-lg font-bold text-green-700">
                            {result.deletedCounts.resumes || 0}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2 border border-green-200">
                          <div className="text-xs text-slate-500">Candidate Stages</div>
                          <div className="text-lg font-bold text-green-700">
                            {result.deletedCounts.candidateStages || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.verification && (
                    <div className="bg-white rounded p-3 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Verification:</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-slate-600">Candidates remaining: </span>
                          <span className={`font-semibold ${
                            result.verification.candidatesRemaining === 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {result.verification.candidatesRemaining}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600">Evaluations remaining: </span>
                          <span className={`font-semibold ${
                            result.verification.evaluationsRemaining === 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {result.verification.evaluationsRemaining}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Result */}
              {result && !result.success && (
                <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <FaTimesCircle className="text-red-600 text-2xl flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 mb-2">
                        ❌ Deletion Failed
                      </h3>
                      <p className="text-red-800 mb-3">{error || 'Unknown error occurred'}</p>
                      {result.details && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-semibold text-red-900">
                            Show Details
                          </summary>
                          <pre className="mt-2 p-3 bg-white rounded border border-red-200 text-xs overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

