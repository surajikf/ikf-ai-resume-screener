import { useState, useEffect } from 'react';
import { FaFileAlt, FaSearch, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const EvaluationProcessIndicator = ({ 
  isEvaluating, 
  totalFiles, 
  completedFiles = 0,
  currentFileName = null 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  const steps = [
    { icon: FaFileAlt, label: 'Reading resume', bgColor: 'bg-blue-100', borderColor: 'border-blue-300', textColor: 'text-blue-600', textColorDark: 'text-blue-700' },
    { icon: FaSearch, label: 'Analyzing skills', bgColor: 'bg-purple-100', borderColor: 'border-purple-300', textColor: 'text-purple-600', textColorDark: 'text-purple-700' },
    { icon: FaSearch, label: 'Comparing with JD', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-300', textColor: 'text-indigo-600', textColorDark: 'text-indigo-700' },
    { icon: FaCheckCircle, label: 'Generating evaluation', bgColor: 'bg-green-100', borderColor: 'border-green-300', textColor: 'text-green-600', textColorDark: 'text-green-700' },
  ];

  useEffect(() => {
    if (!isEvaluating) {
      setCurrentStep(0);
      setStepProgress(0);
      return;
    }

    // Cycle through steps with progress
    const stepInterval = setInterval(() => {
      setStepProgress((prev) => {
        if (prev >= 100) {
          setCurrentStep((step) => (step + 1) % steps.length);
          return 0;
        }
        return prev + 2; // Increment progress
      });
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(stepInterval);
  }, [isEvaluating, steps.length]);

  if (!isEvaluating) return null;

  const CurrentStepIcon = steps[currentStep].icon;
  const currentStepData = steps[currentStep];
  const progress = totalFiles > 0 ? Math.min((completedFiles / totalFiles) * 100, 95) : 0;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
              <FaSpinner className="h-4 w-4 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Evaluating {totalFiles} resume{totalFiles !== 1 ? 's' : ''}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {completedFiles} of {totalFiles} completed
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-blue-700">
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current Step */}
        <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 border border-blue-100">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${currentStepData.bgColor}`}>
            <CurrentStepIcon className={`h-3.5 w-3.5 ${currentStepData.textColor} animate-pulse`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">
              {currentStepData.label}
              {currentFileName && (
                <span className="text-slate-500 ml-1.5">• {currentFileName.length > 20 ? currentFileName.substring(0, 20) + '...' : currentFileName}</span>
              )}
            </p>
            <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-blue-600 transition-all duration-100 ease-linear"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Indicators - Minimal */}
        <div className="flex items-center justify-between gap-1.5">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div
                key={index}
                className={`flex flex-1 flex-col items-center gap-1 rounded-md px-1.5 py-1.5 transition-all ${
                  isActive
                    ? `${step.bgColor} ${step.borderColor} border`
                    : isCompleted
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <StepIcon
                  className={`h-3 w-3 ${
                    isActive
                      ? `${step.textColor} animate-pulse`
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-slate-400'
                  }`}
                />
                <p
                  className={`text-[10px] text-center leading-tight ${
                    isActive
                      ? `${step.textColorDark} font-medium`
                      : isCompleted
                      ? 'text-green-700'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label.split(' ')[0]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EvaluationProcessIndicator;

