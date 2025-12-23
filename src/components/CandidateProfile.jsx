import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CandidateProfileHeader from './CandidateProfileHeader';
import CandidateHiringStages from './CandidateHiringStages';
import CandidateEvaluationHistory from './CandidateEvaluationHistory';
import CandidateCommunicationLog from './CandidateCommunicationLog';
import CandidateNotes from './CandidateNotes';
import ResumeViewer from './ResumeViewer';
import EvaluationModal from './EvaluationModal';
import { getSettings } from '@/utils/settingsStorage';
import {
  FaArrowLeft,
  FaEnvelope,
  FaWhatsapp,
  FaFilePdf,
  FaUser,
  FaChartLine,
  FaBriefcase,
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaStickyNote,
  FaComments,
  FaHistory,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
} from 'react-icons/fa';

const verdictStyles = {
  Recommended: {
    badge: 'bg-green-100 text-green-700',
    icon: FaCheckCircle,
  },
  'Partially Suitable': {
    badge: 'bg-orange-100 text-orange-700',
    icon: FaHourglassHalf,
  },
  'Not Suitable': {
    badge: 'bg-red-100 text-red-700',
    icon: FaTimesCircle,
  },
};

const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
};

export default function CandidateProfile({ candidate, onStageUpdate }) {
  const router = useRouter();
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState({});

  // Smart back navigation - check sessionStorage for return URL
  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Check sessionStorage for stored return URL
      const returnUrl = sessionStorage.getItem('candidateProfileReturnUrl');
      if (returnUrl) {
        // Clear the stored URL
        sessionStorage.removeItem('candidateProfileReturnUrl');
        router.push(returnUrl);
        return;
      }
      
      // Fallback: Check referrer
      const referrer = document.referrer;
      if (referrer && referrer.includes('/candidate-database')) {
        router.push('/candidate-database');
        return;
      }
      
      // Try to go back in history if available
      if (window.history.length > 1) {
        router.back();
        return;
      }
    }
    // Final fallback to home
    router.push('/');
  }, [router]);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = getSettings();
        setSettings(loadedSettings);
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const canSendEmail = settings?.emailSendingEnabled || false;
  const canSendWhatsApp = settings?.whatsappSendingEnabled || false;
  const emailSignature = settings?.emailSignature || '';

  const latestEvaluation = candidate.evaluations && candidate.evaluations.length > 0
    ? candidate.evaluations[0]
    : null;

  const matchScore = latestEvaluation?.matchScore || 0;
  const verdict = latestEvaluation?.verdict || 'Not Suitable';
  const styles = verdictStyles[verdict] || verdictStyles['Not Suitable'];
  const VerdictIcon = styles.icon;
  const scoreColor = getScoreColor(matchScore);

  // Memoize handlers
  const handleViewResume = useCallback((evaluation) => {
    if (evaluation?.id) {
      // Verify evaluation belongs to this candidate
      if (evaluation.candidateId && evaluation.candidateId !== candidate.id) {
        console.error('Evaluation does not belong to candidate:', {
          evaluationId: evaluation.id,
          evaluationCandidateId: evaluation.candidateId,
          currentCandidateId: candidate.id,
        });
        alert('Error: This evaluation does not belong to this candidate.');
        return;
      }
      
      setSelectedResume({
        evaluationId: evaluation.id,
        candidateId: candidate.id, // Pass candidate ID for validation
        candidateName: candidate.candidateName,
      });
    }
  }, [candidate.candidateName, candidate.id]);

  const handleSelectEvaluation = useCallback((evaluation) => {
    setSelectedEvaluation(evaluation);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedEvaluation(null);
    setSelectedResume(null);
  }, []);

  const handleCopy = useCallback(async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [key]: true });
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [copied]);

  // Smart stats calculation
  const stats = useMemo(() => ({
    totalEvaluations: candidate.evaluations?.length || 0,
    avgScore: candidate.evaluations?.length > 0
      ? Math.round(candidate.evaluations.reduce((sum, e) => sum + (e.matchScore || 0), 0) / candidate.evaluations.length)
      : 0,
    totalCommunications: (candidate.emailLogs?.length || 0) + (candidate.whatsappLogs?.length || 0),
    lastContact: candidate.emailLogs?.[0]?.sentAt || candidate.whatsappLogs?.[0]?.sentAt || null,
  }), [candidate]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaUser },
    { id: 'evaluations', label: `Evaluations (${stats.totalEvaluations})`, icon: FaHistory },
    { id: 'communications', label: `Communications (${stats.totalCommunications})`, icon: FaComments },
    { id: 'notes', label: 'Notes', icon: FaStickyNote },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Compact Header Bar - Full Width */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="w-full px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back + Candidate Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={handleBack}
                className="flex-shrink-0 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                title="Go Back"
              >
                <FaArrowLeft />
              </button>

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <FaUser className="text-white text-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold text-slate-900 truncate">
                    {candidate.candidateName || 'Unknown Candidate'}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {candidate.currentDesignation && (
                      <span className="flex items-center gap-1">
                        <FaBriefcase className="text-xs" />
                        {candidate.currentDesignation}
                      </span>
                    )}
                    {candidate.currentCompany && (
                      <span className="flex items-center gap-1">
                        <FaBuilding className="text-xs" />
                        {candidate.currentCompany}
                      </span>
                    )}
                    {candidate.candidateLocation && (
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt className="text-xs" />
                        {candidate.candidateLocation}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Key Metrics */}
            <div className="hidden lg:flex items-center gap-4">
              {latestEvaluation && (
                <>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                    matchScore >= 80 ? 'bg-green-50 border-green-200' :
                    matchScore >= 50 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <FaChartLine className={`text-sm ${scoreColor}`} />
                    <span className={`text-base font-bold ${scoreColor}`}>
                      {matchScore}%
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${styles.badge}`}>
                    <VerdictIcon className="text-xs" />
                    {verdict}
                  </span>
                  <div className="text-xs text-slate-500">
                    {candidate.totalExperienceYears > 0 && `${candidate.totalExperienceYears}Y exp`}
                    {candidate.numberOfCompanies > 0 && ` • ${candidate.numberOfCompanies} companies`}
                  </div>
                </>
              )}
            </div>

            {/* Right: Quick Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {latestEvaluation && (
                <>
                  {canSendEmail && latestEvaluation.emailDraft && (
                    <button
                      onClick={() => handleSelectEvaluation(latestEvaluation)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                      title="Send Email"
                    >
                      <FaEnvelope className="text-xs" />
                      <span className="hidden sm:inline">Email</span>
                    </button>
                  )}
                  {canSendWhatsApp && latestEvaluation.whatsappDraft && (
                    <button
                      onClick={() => handleSelectEvaluation(latestEvaluation)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                      title="Send WhatsApp"
                    >
                      <FaWhatsapp className="text-xs" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  )}
                  {candidate.resume && (
                    <button
                      onClick={() => handleViewResume(latestEvaluation)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 text-white text-xs font-medium rounded-md hover:bg-slate-700 transition-colors"
                      title="View Resume"
                    >
                      <FaFilePdf className="text-xs" />
                      <span className="hidden sm:inline">Resume</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="w-full border-t border-slate-200 bg-white">
          <div className="px-6">
            <div className="flex items-center gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <TabIcon className="text-xs" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <div className="w-full">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Hiring Pipeline */}
                <CandidateHiringStages
                  candidate={candidate}
                  onStageUpdate={onStageUpdate}
                />

                {/* Quick Stats Grid */}
                {latestEvaluation && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-900 mb-4">Score Breakdown</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {latestEvaluation.scoreBreakdown && Object.entries(latestEvaluation.scoreBreakdown).map(([key, value]) => {
                        const label = key === 'jdMatch' ? 'JD Match' :
                                     key === 'experienceMatch' ? 'Experience' :
                                     key === 'educationMatch' ? 'Education' :
                                     key === 'locationMatch' ? 'Location' :
                                     key === 'stabilityScore' ? 'Stability' : key;
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-slate-600">{label}</span>
                              <span className={`font-semibold ${getScoreColor(value)}`}>
                                {value}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  value >= 80 ? 'bg-green-500' :
                                  value >= 50 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Professional Summary */}
                {candidate.profileSummary && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-900 mb-3">Professional Summary</h2>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {candidate.profileSummary}
                    </p>
                  </div>
                )}

                {/* Key Strengths & Gaps */}
                {latestEvaluation && (latestEvaluation.strengths?.length > 0 || latestEvaluation.gaps?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {latestEvaluation.strengths?.length > 0 && (
                      <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-base font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <FaCheckCircle className="text-sm" />
                          Key Strengths
                        </h2>
                        <ul className="space-y-2">
                          {latestEvaluation.strengths.slice(0, 5).map((strength, idx) => (
                            <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-green-600 mt-1 flex-shrink-0">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {latestEvaluation.gaps?.length > 0 && (
                      <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-base font-semibold text-red-700 mb-3 flex items-center gap-2">
                          <FaTimesCircle className="text-sm" />
                          Gaps
                        </h2>
                        <ul className="space-y-2">
                          {latestEvaluation.gaps.slice(0, 5).map((gap, idx) => (
                            <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-red-600 mt-1 flex-shrink-0">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Contact & Info */}
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h2 className="text-base font-semibold text-slate-900 mb-4">Contact</h2>
                  <div className="space-y-3">
                    {candidate.candidateEmail && (
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <FaEnvelope className="text-slate-400 flex-shrink-0 text-sm" />
                          <a
                            href={`mailto:${candidate.candidateEmail}`}
                            className="text-sm text-blue-600 hover:text-blue-700 truncate"
                          >
                            {candidate.candidateEmail}
                          </a>
                        </div>
                        <button
                          onClick={() => handleCopy(candidate.candidateEmail, 'email')}
                          className="ml-2 p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title="Copy email"
                        >
                          {copied.email ? <FaCheck className="text-green-600 text-xs" /> : <FaCopy className="text-xs" />}
                        </button>
                      </div>
                    )}
                    {candidate.candidateWhatsApp && (
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <FaWhatsapp className="text-slate-400 flex-shrink-0 text-sm" />
                          <a
                            href={`https://wa.me/91${candidate.candidateWhatsApp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            {candidate.candidateWhatsApp}
                          </a>
                        </div>
                        <button
                          onClick={() => handleCopy(candidate.candidateWhatsApp, 'whatsapp')}
                          className="ml-2 p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title="Copy WhatsApp"
                        >
                          {copied.whatsapp ? <FaCheck className="text-green-600 text-xs" /> : <FaCopy className="text-xs" />}
                        </button>
                      </div>
                    )}
                    {candidate.linkedInUrl && (
                      <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-lg">
                        <FaExternalLinkAlt className="text-slate-400 flex-shrink-0 text-sm" />
                        <a
                          href={candidate.linkedInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Info */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Info</h2>
                  <div className="space-y-3 text-sm">
                    {candidate.totalExperienceYears > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Experience</span>
                        <span className="font-semibold text-slate-900">{candidate.totalExperienceYears} years</span>
                      </div>
                    )}
                    {candidate.numberOfCompanies > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Companies</span>
                        <span className="font-semibold text-slate-900">{candidate.numberOfCompanies}</span>
                      </div>
                    )}
                    {stats.avgScore > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Avg Score</span>
                        <span className={`font-semibold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}%</span>
                      </div>
                    )}
                    {stats.lastContact && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Last Contact</span>
                        <span className="font-semibold text-slate-900 text-xs">
                          {(() => {
                            try {
                              const date = new Date(stats.lastContact);
                              return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                            } catch {
                              return 'N/A';
                            }
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evaluations Tab */}
        {activeTab === 'evaluations' && candidate.evaluations && candidate.evaluations.length > 0 && (
          <div className="px-6 py-6">
            <CandidateEvaluationHistory
              evaluations={candidate.evaluations}
              onViewResume={handleViewResume}
              onSelectEvaluation={handleSelectEvaluation}
            />
          </div>
        )}

        {/* Communications Tab */}
        {activeTab === 'communications' && (
          <div className="px-6 py-6">
            <CandidateCommunicationLog
              emailLogs={candidate.emailLogs || []}
              whatsappLogs={candidate.whatsappLogs || []}
            />
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="px-6 py-6">
            <CandidateNotes candidateId={candidate.id} />
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedEvaluation && (
        <EvaluationModal
          candidate={{
            ...selectedEvaluation,
            candidateName: candidate.candidateName,
            candidateEmail: candidate.candidateEmail,
            candidateWhatsApp: candidate.candidateWhatsApp,
            linkedInUrl: candidate.linkedInUrl,
            candidateLocation: candidate.candidateLocation,
          }}
          onClose={handleCloseModal}
          emailSignature={emailSignature}
          canSendEmail={canSendEmail}
          canSendWhatsApp={canSendWhatsApp}
        />
      )}

      {selectedResume && (
        <ResumeViewer
          evaluationId={selectedResume.evaluationId}
          candidateName={selectedResume.candidateName}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
