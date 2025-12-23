import { FaChartLine, FaBriefcase, FaBuilding, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';

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

export default function CandidateQuickStats({ candidate, latestEvaluation }) {
  const matchScore = latestEvaluation?.matchScore || 0;
  const scoreBreakdown = latestEvaluation?.scoreBreakdown || {};
  const scoreColor = getScoreColor(matchScore);
  const scoreBg = getScoreBg(matchScore);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Overall Match Score */}
        <div className={`rounded-lg border ${scoreBg} p-4 text-center`}>
          <div className="flex items-center justify-center mb-2">
            <FaChartLine className={`text-2xl ${scoreColor}`} />
          </div>
          <div className={`text-3xl font-bold ${scoreColor} mb-1`}>
            {matchScore}%
          </div>
          <div className="text-xs text-slate-600">Match Score</div>
        </div>

        {/* Total Experience */}
        {candidate.totalExperienceYears > 0 && (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <FaCalendarAlt className="text-2xl text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {candidate.totalExperienceYears}Y
            </div>
            <div className="text-xs text-slate-600">Experience</div>
          </div>
        )}

        {/* Number of Companies */}
        {candidate.numberOfCompanies > 0 && (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <FaBuilding className="text-2xl text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {candidate.numberOfCompanies}
            </div>
            <div className="text-xs text-slate-600">Companies</div>
          </div>
        )}

        {/* Current Role */}
        {candidate.currentDesignation && (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-center mb-2">
              <FaBriefcase className="text-2xl text-slate-400" />
            </div>
            <div className="text-sm font-semibold text-slate-900 mb-1 truncate" title={candidate.currentDesignation}>
              {candidate.currentDesignation}
            </div>
            <div className="text-xs text-slate-600">Current Role</div>
          </div>
        )}

        {/* Location */}
        {candidate.candidateLocation && (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-center mb-2">
              <FaMapMarkerAlt className="text-2xl text-slate-400" />
            </div>
            <div className="text-sm font-semibold text-slate-900 mb-1 truncate" title={candidate.candidateLocation}>
              {candidate.candidateLocation}
            </div>
            <div className="text-xs text-slate-600">Location</div>
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      {Object.keys(scoreBreakdown).length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Score Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {scoreBreakdown.jdMatch !== undefined && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600">JD Match</span>
                  <span className={`font-semibold ${getScoreColor(scoreBreakdown.jdMatch)}`}>
                    {scoreBreakdown.jdMatch}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      scoreBreakdown.jdMatch >= 80 ? 'bg-green-500' :
                      scoreBreakdown.jdMatch >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${scoreBreakdown.jdMatch}%` }}
                  />
                </div>
              </div>
            )}
            {scoreBreakdown.experienceMatch !== undefined && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600">Experience</span>
                  <span className={`font-semibold ${getScoreColor(scoreBreakdown.experienceMatch)}`}>
                    {scoreBreakdown.experienceMatch}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      scoreBreakdown.experienceMatch >= 80 ? 'bg-green-500' :
                      scoreBreakdown.experienceMatch >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${scoreBreakdown.experienceMatch}%` }}
                  />
                </div>
              </div>
            )}
            {scoreBreakdown.educationMatch !== undefined && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600">Education</span>
                  <span className={`font-semibold ${getScoreColor(scoreBreakdown.educationMatch)}`}>
                    {scoreBreakdown.educationMatch}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      scoreBreakdown.educationMatch >= 80 ? 'bg-green-500' :
                      scoreBreakdown.educationMatch >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${scoreBreakdown.educationMatch}%` }}
                  />
                </div>
              </div>
            )}
            {scoreBreakdown.locationMatch !== undefined && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600">Location</span>
                  <span className={`font-semibold ${getScoreColor(scoreBreakdown.locationMatch)}`}>
                    {scoreBreakdown.locationMatch}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      scoreBreakdown.locationMatch >= 80 ? 'bg-green-500' :
                      scoreBreakdown.locationMatch >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${scoreBreakdown.locationMatch}%` }}
                  />
                </div>
              </div>
            )}
            {scoreBreakdown.stabilityScore !== undefined && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600">Stability</span>
                  <span className={`font-semibold ${getScoreColor(scoreBreakdown.stabilityScore)}`}>
                    {scoreBreakdown.stabilityScore}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      scoreBreakdown.stabilityScore >= 80 ? 'bg-green-500' :
                      scoreBreakdown.stabilityScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${scoreBreakdown.stabilityScore}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

