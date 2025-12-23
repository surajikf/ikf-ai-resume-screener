import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaEnvelope,
  FaWhatsapp,
  FaFilePdf,
  FaUser,
  FaChartLine,
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

const getScoreBg = (score) => {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 50) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
};

export default function CandidateProfileHeader({
  candidate,
  latestEvaluation,
  onViewResume,
  onSelectEvaluation,
  canSendEmail,
  canSendWhatsApp,
}) {
  const router = useRouter();
  const matchScore = latestEvaluation?.matchScore || 0;
  const verdict = latestEvaluation?.verdict || 'Not Suitable';
  const styles = verdictStyles[verdict] || verdictStyles['Not Suitable'];
  const VerdictIcon = styles.icon;
  const scoreColor = getScoreColor(matchScore);
  const scoreBg = getScoreBg(matchScore);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back button and candidate info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Link
              href="/"
              className="flex-shrink-0 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              title="Back to Dashboard"
            >
              <FaArrowLeft />
            </Link>

            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUser className="text-blue-600 text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-slate-900 truncate">
                  {candidate.candidateName || 'Unknown Candidate'}
                </h1>
                <p className="text-sm text-slate-500">
                  {candidate.currentDesignation || candidate.currentCompany || 'Candidate'}
                </p>
              </div>
            </div>
          </div>

          {/* Center: Stats badges */}
          <div className="hidden md:flex items-center gap-3">
            {latestEvaluation && (
              <>
                <div className={`flex items-center gap-2 rounded-lg border ${scoreBg} px-3 py-1.5`}>
                  <FaChartLine className={`text-sm ${scoreColor}`} />
                  <span className={`text-lg font-bold ${scoreColor}`}>
                    {matchScore}%
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${styles.badge}`}>
                  <VerdictIcon className="text-xs" />
                  {verdict}
                </span>
              </>
            )}
            <span className="text-sm text-slate-500">
              {candidate.evaluations?.length || 0} evaluation{(candidate.evaluations?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {latestEvaluation && (
              <>
                {canSendEmail && latestEvaluation.emailDraft && (
                  <button
                    onClick={() => onSelectEvaluation(latestEvaluation)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    title="Send Email"
                  >
                    <FaEnvelope />
                    <span className="hidden sm:inline">Email</span>
                  </button>
                )}
                {canSendWhatsApp && latestEvaluation.whatsappDraft && (
                  <button
                    onClick={() => onSelectEvaluation(latestEvaluation)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                    title="Send WhatsApp"
                  >
                    <FaWhatsapp />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                )}
                {candidate.resume && (
                  <button
                    onClick={onViewResume}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-600 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
                    title="View Resume"
                  >
                    <FaFilePdf />
                    <span className="hidden sm:inline">Resume</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

