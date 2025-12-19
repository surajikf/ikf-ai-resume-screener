import { useState } from "react";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaBuilding,
  FaLinkedin,
  FaCalendarAlt,
  FaFilePdf,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import EvaluationHistoryTimeline from "./EvaluationHistoryTimeline";

const verdictStyles = {
  Recommended: {
    badge: "bg-green-100 text-green-700",
    border: "border-green-200",
    scoreColor: "text-green-600",
    scoreBg: "bg-green-50",
  },
  "Partially Suitable": {
    badge: "bg-orange-100 text-orange-700",
    border: "border-orange-200",
    scoreColor: "text-orange-600",
    scoreBg: "bg-orange-50",
  },
  "Not Suitable": {
    badge: "bg-red-100 text-red-700",
    border: "border-red-200",
    scoreColor: "text-red-600",
    scoreBg: "bg-red-50",
  },
};

const CandidateDetailCard = ({ candidate, onClose, onViewResume }) => {
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    evaluations: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const latestEvaluation = candidate.latestEvaluation;
  const workExperience = latestEvaluation?.workExperience || [];

  return (
    <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaUser className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {candidate.candidateName || "Unknown Candidate"}
              </h2>
              <p className="text-sm text-slate-500">
                {candidate.totalEvaluations} evaluation{candidate.totalEvaluations !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Profile Section */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection("profile")}
            className="w-full flex items-center justify-between mb-4 text-left"
          >
            <h3 className="text-lg font-semibold text-slate-900">Profile Information</h3>
            {expandedSections.profile ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {expandedSections.profile && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {candidate.candidateEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaEnvelope className="text-slate-400" />
                      <span className="text-slate-600">Email:</span>
                      <a
                        href={`mailto:${candidate.candidateEmail}`}
                        className="text-blue-600 hover:text-blue-700 truncate"
                      >
                        {candidate.candidateEmail}
                      </a>
                    </div>
                  )}
                  {candidate.candidateWhatsApp && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaPhone className="text-slate-400" />
                      <span className="text-slate-600">WhatsApp:</span>
                      <a
                        href={`https://wa.me/91${candidate.candidateWhatsApp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {candidate.candidateWhatsApp}
                      </a>
                    </div>
                  )}
                  {candidate.candidateLocation && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaMapMarkerAlt className="text-slate-400" />
                      <span className="text-slate-600">Location:</span>
                      <span className="text-slate-900">{candidate.candidateLocation}</span>
                    </div>
                  )}
                  {candidate.linkedInUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaLinkedin className="text-slate-400" />
                      <span className="text-slate-600">LinkedIn:</span>
                      <a
                        href={candidate.linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        View Profile
                        <FaExternalLinkAlt className="text-xs" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Professional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {candidate.currentDesignation && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaBriefcase className="text-slate-400" />
                      <span className="text-slate-600">Current Role:</span>
                      <span className="text-slate-900 font-medium">
                        {candidate.currentDesignation}
                      </span>
                    </div>
                  )}
                  {candidate.currentCompany && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaBuilding className="text-slate-400" />
                      <span className="text-slate-600">Current Company:</span>
                      <span className="text-slate-900 font-medium">{candidate.currentCompany}</span>
                    </div>
                  )}
                  {candidate.totalExperienceYears > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaCalendarAlt className="text-slate-400" />
                      <span className="text-slate-600">Total Experience:</span>
                      <span className="text-slate-900 font-medium">
                        {candidate.totalExperienceYears} years
                      </span>
                    </div>
                  )}
                  {candidate.numberOfCompanies > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaBuilding className="text-slate-400" />
                      <span className="text-slate-600">Companies:</span>
                      <span className="text-slate-900 font-medium">
                        {candidate.numberOfCompanies}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Experience Breakdown */}
              {workExperience.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                    Work Experience
                  </h4>
                  <div className="space-y-2">
                    {workExperience
                      .filter((exp) => exp.companyName !== "Total Experience")
                      .map((exp, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-3 border border-slate-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-slate-900">
                                {exp.companyName || "Unknown Company"}
                              </div>
                              {exp.role && (
                                <div className="text-sm text-slate-600 mt-1">{exp.role}</div>
                              )}
                            </div>
                            {exp.duration && (
                              <div className="text-sm text-slate-500 ml-4">{exp.duration}</div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Profile Summary */}
              {candidate.profileSummary && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                    Profile Summary
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {candidate.profileSummary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Evaluation History */}
        <div>
          <button
            onClick={() => toggleSection("evaluations")}
            className="w-full flex items-center justify-between mb-4 text-left"
          >
            <h3 className="text-lg font-semibold text-slate-900">Evaluation History</h3>
            {expandedSections.evaluations ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {expandedSections.evaluations && (
            <div>
              {candidate.evaluations && candidate.evaluations.length > 0 ? (
                <EvaluationHistoryTimeline
                  evaluations={candidate.evaluations}
                  onViewResume={onViewResume}
                />
              ) : (
                <div className="bg-slate-50 rounded-lg p-6 text-center text-slate-500">
                  No evaluations found for this candidate.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailCard;

