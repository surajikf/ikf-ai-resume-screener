import { useState, useMemo } from 'react';
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
  FaEdit,
  FaHistory,
  FaUser,
} from 'react-icons/fa';
import CandidateHiringStagesModal from './CandidateHiringStagesModal';

const PIPELINE_STAGES = [
  { 
    value: 'Applied/Received', 
    label: 'Applied/Received', 
    shortLabel: 'Applied',
    color: 'gray',
    icon: FaCheckCircle 
  },
  { 
    value: 'Screening/Review', 
    label: 'Screening/Review', 
    shortLabel: 'Screening',
    color: 'blue',
    icon: FaClock 
  },
  { 
    value: 'Shortlisted', 
    label: 'Shortlisted', 
    shortLabel: 'Shortlisted',
    color: 'green',
    icon: FaUserCheck 
  },
  { 
    value: 'Interview Scheduled', 
    label: 'Interview Scheduled', 
    shortLabel: 'Interview',
    color: 'purple',
    icon: FaCalendarCheck 
  },
  { 
    value: 'Interview Completed', 
    label: 'Interview Completed', 
    shortLabel: 'Completed',
    color: 'orange',
    icon: FaClipboardCheck 
  },
  { 
    value: 'Offer Extended', 
    label: 'Offer Extended', 
    shortLabel: 'Offer',
    color: 'teal',
    icon: FaHandshake 
  },
  { 
    value: 'Offer Accepted', 
    label: 'Offer Accepted', 
    shortLabel: 'Accepted',
    color: 'green',
    icon: FaCheck 
  },
];

const TERMINAL_STAGES = [
  { value: 'Rejected', label: 'Rejected', color: 'red', icon: FaTimes },
  { value: 'On Hold', label: 'On Hold', color: 'yellow', icon: FaPause },
];

const ALL_STAGES = [...PIPELINE_STAGES, ...TERMINAL_STAGES];

const getStageIndex = (stage) => {
  return PIPELINE_STAGES.findIndex(s => s.value === stage);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

const getTimeInStage = (stageHistory, currentStage) => {
  if (!stageHistory || stageHistory.length === 0) return null;
  const currentStageEntry = stageHistory.find(entry => entry.stage === currentStage);
  if (!currentStageEntry || !currentStageEntry.createdAt) return null;
  
  try {
    const date = new Date(currentStageEntry.createdAt);
    if (isNaN(date.getTime())) return null;
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      return 'Just now';
    }
  } catch {
    return null;
  }
};

export default function CandidateHiringStages({ candidate, onStageUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);

  const currentStage = candidate.currentStage || 'Applied/Received';
  const currentIndex = getStageIndex(currentStage);
  const stageHistory = candidate.stageHistory || [];
  const isTerminal = TERMINAL_STAGES.some(s => s.value === currentStage);

  // Get next stage
  const nextStage = useMemo(() => {
    if (isTerminal || currentIndex === -1 || currentIndex >= PIPELINE_STAGES.length - 1) {
      return null;
    }
    return PIPELINE_STAGES[currentIndex + 1];
  }, [currentIndex, isTerminal]);

  // Get current stage info
  const currentStageInfo = ALL_STAGES.find(s => s.value === currentStage);

  const handleQuickNext = async () => {
    if (!nextStage) return;
    
    setSelectedStage(nextStage.value);
    setComment('');
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setSelectedStage(null);
    setComment('');
    setShowModal(true);
  };

  const handleQuickReject = () => {
    setSelectedStage('Rejected');
    setComment('');
    setShowModal(true);
  };

  const handleQuickHold = () => {
    setSelectedStage('On Hold');
    setComment('');
    setShowModal(true);
  };

  const handleConfirmStageChange = async () => {
    if (!selectedStage || !comment.trim()) return;

    try {
      setUpdating(true);
      await onStageUpdate(selectedStage, comment.trim(), null);
      setShowModal(false);
      setSelectedStage(null);
      setComment('');
    } catch (err) {
      console.error('Error updating stage:', err);
      const errorMessage = err.message || 'Failed to update stage. Please try again.';
      
      if (errorMessage.includes('Database schema') || errorMessage.includes('migration')) {
        alert('Database setup required. Please contact your administrator to run the migration script.');
      } else {
        alert(errorMessage);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedStage(null);
    setComment('');
  };

  const getProgressPercentage = () => {
    if (isTerminal) return 100;
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / PIPELINE_STAGES.length) * 100;
  };

  const timeInStage = getTimeInStage(stageHistory, currentStage);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Hiring Pipeline</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
              {currentStageInfo?.icon && <currentStageInfo.icon className="text-xs" />}
              {currentStage}
            </span>
            {timeInStage && (
              <span className="text-slate-500">
                In this stage for {timeInStage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="mb-6">
        <div className="relative">
          {/* Progress Bar */}
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>

          {/* Stage Nodes */}
          <div className="flex items-center justify-between relative">
            {PIPELINE_STAGES.map((stage, index) => {
              const StageIcon = stage.icon;
              const isActive = stage.value === currentStage;
              const isPast = index < currentIndex;
              const isNext = index === currentIndex + 1;

              return (
                <div key={stage.value} className="flex flex-col items-center flex-1 relative">
                  {/* Connector Line */}
                  {index < PIPELINE_STAGES.length - 1 && (
                    <div
                      className={`absolute top-4 left-[50%] w-full h-0.5 ${
                        index < currentIndex ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                      style={{ zIndex: 0 }}
                    />
                  )}
                  
                  {/* Stage Node */}
                  <div
                    className={`relative z-10 flex flex-col items-center ${
                      isActive ? 'cursor-pointer' : isPast ? 'cursor-pointer' : 'cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!isActive) {
                        setSelectedStage(stage.value);
                        setComment('');
                        setShowModal(true);
                      }
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive
                          ? 'bg-blue-600 border-blue-700 shadow-lg scale-110'
                          : isPast
                          ? 'bg-green-500 border-green-600'
                          : isNext
                          ? 'bg-blue-100 border-blue-300'
                          : 'bg-slate-100 border-slate-300'
                      }`}
                    >
                      <StageIcon
                        className={`text-sm ${
                          isActive
                            ? 'text-white'
                            : isPast
                            ? 'text-white'
                            : isNext
                            ? 'text-blue-600'
                            : 'text-slate-400'
                        }`}
                      />
                    </div>
                    {isPast && !isActive && (
                      <FaCheckCircle className="absolute -top-1 -right-1 text-green-600 bg-white rounded-full text-xs" />
                    )}
                    <div className="mt-2 text-center">
                      <p
                        className={`text-xs font-medium ${
                          isActive
                            ? 'text-blue-700'
                            : isPast
                            ? 'text-slate-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {stage.shortLabel}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {nextStage && (
          <button
            onClick={handleQuickNext}
            disabled={updating}
            className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <FaArrowRight />
            Move to {nextStage.label}
          </button>
        )}
        <button
          onClick={handleOpenModal}
          disabled={updating}
          className="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaEdit />
          Change Stage
        </button>
        {!isTerminal && (
          <>
            <button
              onClick={handleQuickReject}
              disabled={updating}
              className="inline-flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200"
            >
              <FaTimes />
              Reject
            </button>
            <button
              onClick={handleQuickHold}
              disabled={updating}
              className="inline-flex items-center gap-2 px-4 py-3 bg-yellow-50 text-yellow-700 font-medium rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-200"
            >
              <FaPause />
              Put on Hold
            </button>
          </>
        )}
      </div>

      {/* Stage History */}
      {stageHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FaHistory />
              Stage History
            </h3>
            <span className="text-xs text-slate-500">{stageHistory.length} transition{stageHistory.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stageHistory.map((entry, index) => {
              const stageInfo = ALL_STAGES.find(s => s.value === entry.stage);
              const StageIcon = stageInfo?.icon || FaCheckCircle;
              
              return (
                <div
                  key={entry.id || index}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <StageIcon className="text-xs text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-900">{entry.stage}</span>
                      <span className="text-xs text-slate-500">{formatDate(entry.createdAt)}</span>
                    </div>
                    {entry.comment && (
                      <p className="text-sm text-slate-600 mt-1">{entry.comment}</p>
                    )}
                    {entry.changedBy && (
                      <div className="flex items-center gap-1 mt-2">
                        <FaUser className="text-xs text-slate-400" />
                        <span className="text-xs text-slate-500">Changed by {entry.changedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CandidateHiringStagesModal
          currentStage={currentStage}
          selectedStage={selectedStage}
          onStageSelect={setSelectedStage}
          comment={comment}
          onCommentChange={setComment}
          onConfirm={handleConfirmStageChange}
          onCancel={handleCancel}
          updating={updating}
        />
      )}
    </div>
  );
}
