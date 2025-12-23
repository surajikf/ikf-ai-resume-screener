import { useState } from 'react';
import {
  FaCheckCircle,
  FaClock,
  FaUserCheck,
  FaCalendarCheck,
  FaClipboardCheck,
  FaHandshake,
  FaCheck,
  FaTimes,
  FaPause,
  FaArrowRight,
  FaExclamationTriangle,
} from 'react-icons/fa';

const PIPELINE_STAGES = [
  { 
    value: 'Applied/Received', 
    label: 'Applied/Received', 
    description: 'Candidate has submitted application',
    color: 'gray',
    icon: FaCheckCircle 
  },
  { 
    value: 'Screening/Review', 
    label: 'Screening/Review', 
    description: 'Resume and profile under review',
    color: 'blue',
    icon: FaClock 
  },
  { 
    value: 'Shortlisted', 
    label: 'Shortlisted', 
    description: 'Candidate meets initial requirements',
    color: 'green',
    icon: FaUserCheck 
  },
  { 
    value: 'Interview Scheduled', 
    label: 'Interview Scheduled', 
    description: 'Interview date and time confirmed',
    color: 'purple',
    icon: FaCalendarCheck 
  },
  { 
    value: 'Interview Completed', 
    label: 'Interview Completed', 
    description: 'Interview has been conducted',
    color: 'orange',
    icon: FaClipboardCheck 
  },
  { 
    value: 'Offer Extended', 
    label: 'Offer Extended', 
    description: 'Job offer has been sent to candidate',
    color: 'teal',
    icon: FaHandshake 
  },
  { 
    value: 'Offer Accepted', 
    label: 'Offer Accepted', 
    description: 'Candidate has accepted the offer',
    color: 'green',
    icon: FaCheck 
  },
];

const TERMINAL_STAGES = [
  { 
    value: 'Rejected', 
    label: 'Rejected', 
    description: 'Candidate did not meet requirements',
    color: 'red',
    icon: FaTimes 
  },
  { 
    value: 'On Hold', 
    label: 'On Hold', 
    description: 'Application temporarily paused',
    color: 'yellow',
    icon: FaPause 
  },
];

const getStageIndex = (stage) => {
  return PIPELINE_STAGES.findIndex(s => s.value === stage);
};

export default function CandidateHiringStagesModal({
  currentStage,
  selectedStage,
  onStageSelect,
  comment,
  onCommentChange,
  onConfirm,
  onCancel,
  updating,
}) {
  const [showWarning, setShowWarning] = useState(false);
  const currentIndex = getStageIndex(currentStage);
  const selectedIndex = selectedStage ? getStageIndex(selectedStage) : -1;

  // Check if moving backwards or to terminal state
  const isBackwardMove = selectedIndex >= 0 && selectedIndex < currentIndex;
  const isTerminalMove = TERMINAL_STAGES.some(s => s.value === selectedStage);
  const isSameStage = selectedStage === currentStage;

  const handleConfirm = () => {
    if (!selectedStage) return;
    if (isSameStage) {
      alert('Please select a different stage.');
      return;
    }
    if (isBackwardMove && !showWarning) {
      setShowWarning(true);
      return;
    }
    onConfirm();
  };

  const getColorClasses = (color) => {
    const colors = {
      gray: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
      green: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
      teal: 'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200',
      red: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
    };
    return colors[color] || colors.gray;
  };

  const getSelectedColorClasses = (color) => {
    const colors = {
      gray: 'bg-gray-200 text-gray-900 border-gray-400 ring-2 ring-gray-500',
      blue: 'bg-blue-200 text-blue-900 border-blue-400 ring-2 ring-blue-500',
      green: 'bg-green-200 text-green-900 border-green-400 ring-2 ring-green-500',
      purple: 'bg-purple-200 text-purple-900 border-purple-400 ring-2 ring-purple-500',
      orange: 'bg-orange-200 text-orange-900 border-orange-400 ring-2 ring-orange-500',
      teal: 'bg-teal-200 text-teal-900 border-teal-400 ring-2 ring-teal-500',
      red: 'bg-red-200 text-red-900 border-red-400 ring-2 ring-red-500',
      yellow: 'bg-yellow-200 text-yellow-900 border-yellow-400 ring-2 ring-yellow-500',
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Change Hiring Stage</h3>
              <p className="text-sm text-slate-500 mt-1">
                Current: <span className="font-medium text-slate-700">{currentStage}</span>
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              disabled={updating}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Pipeline Stages */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Pipeline Stages</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PIPELINE_STAGES.map((stage) => {
                const StageIcon = stage.icon;
                const isCurrent = stage.value === currentStage;
                const isSelected = stage.value === selectedStage;
                const stageIndex = getStageIndex(stage.value);
                const isPast = stageIndex <= currentIndex;

                return (
                  <button
                    key={stage.value}
                    onClick={() => onStageSelect(stage.value)}
                    disabled={updating}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? getSelectedColorClasses(stage.color)
                        : isCurrent
                        ? `${getColorClasses(stage.color)} ring-2 ring-offset-1`
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <StageIcon className="text-sm" />
                      <span className="text-sm font-medium">{stage.label}</span>
                      {isCurrent && (
                        <span className="ml-auto text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                      {isPast && !isCurrent && (
                        <FaCheckCircle className="ml-auto text-xs text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{stage.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terminal Stages */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Terminal States</h4>
            <div className="grid grid-cols-2 gap-2">
              {TERMINAL_STAGES.map((stage) => {
                const StageIcon = stage.icon;
                const isCurrent = stage.value === currentStage;
                const isSelected = stage.value === selectedStage;

                return (
                  <button
                    key={stage.value}
                    onClick={() => onStageSelect(stage.value)}
                    disabled={updating}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? getSelectedColorClasses(stage.color)
                        : isCurrent
                        ? `${getColorClasses(stage.color)} ring-2 ring-offset-1`
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <StageIcon className="text-sm" />
                      <span className="text-sm font-medium">{stage.label}</span>
                      {isCurrent && (
                        <span className="ml-auto text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{stage.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warning for backward moves */}
          {showWarning && isBackwardMove && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <FaExclamationTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Moving Backward in Pipeline
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  You&apos;re moving this candidate to an earlier stage. This is allowed but please add a comment explaining why.
                </p>
              </div>
            </div>
          )}

          {/* Comment Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Add a comment explaining this stage change..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              maxLength={500}
              disabled={updating}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">
                {comment.length}/500 characters
              </p>
              {!comment.trim() && (
                <p className="text-xs text-red-500">Comment is required</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            disabled={updating}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={updating || !selectedStage || !comment.trim() || isSameStage}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {updating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <FaArrowRight />
                Confirm Change
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

