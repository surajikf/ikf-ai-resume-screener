import { useState } from 'react';
import {
  FaEnvelope,
  FaPhone,
  FaLinkedin,
  FaMapMarkerAlt,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
} from 'react-icons/fa';

export default function CandidateContactPanel({ candidate }) {
  const [copied, setCopied] = useState({});

  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [key]: true });
      setTimeout(() => {
        setCopied({ ...copied, [key]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>

      <div className="space-y-3">
        {/* Email */}
        {candidate.candidateEmail && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FaEnvelope className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500 mb-1">Email</div>
                <a
                  href={`mailto:${candidate.candidateEmail}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 truncate block"
                >
                  {candidate.candidateEmail}
                </a>
              </div>
            </div>
            <button
              onClick={() => handleCopy(candidate.candidateEmail, 'email')}
              className="ml-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              title="Copy email"
            >
              {copied.email ? <FaCheck className="text-green-600" /> : <FaCopy />}
            </button>
          </div>
        )}

        {/* WhatsApp */}
        {candidate.candidateWhatsApp && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FaPhone className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500 mb-1">WhatsApp</div>
                <a
                  href={`https://wa.me/91${candidate.candidateWhatsApp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {candidate.candidateWhatsApp}
                </a>
              </div>
            </div>
            <button
              onClick={() => handleCopy(candidate.candidateWhatsApp, 'whatsapp')}
              className="ml-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              title="Copy WhatsApp number"
            >
              {copied.whatsapp ? <FaCheck className="text-green-600" /> : <FaCopy />}
            </button>
          </div>
        )}

        {/* LinkedIn */}
        {candidate.linkedInUrl && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FaLinkedin className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500 mb-1">LinkedIn</div>
                <a
                  href={candidate.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View Profile
                  <FaExternalLinkAlt className="text-xs" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        {candidate.candidateLocation && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <FaMapMarkerAlt className="text-slate-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500 mb-1">Location</div>
              <div className="text-sm font-medium text-slate-900">
                {candidate.candidateLocation}
              </div>
            </div>
          </div>
        )}

        {/* Current Company */}
        {candidate.currentCompany && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500 mb-1">Current Company</div>
              <div className="text-sm font-medium text-slate-900">
                {candidate.currentCompany}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!candidate.candidateEmail && !candidate.candidateWhatsApp && !candidate.linkedInUrl && !candidate.candidateLocation && (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No contact information available</p>
          </div>
        )}
      </div>
    </div>
  );
}

