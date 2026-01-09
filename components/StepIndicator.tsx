// ========================================
// STEP INDICATOR COMPONENT
// Visual progress through the workflow
// ========================================

import React from 'react';

interface Props {
  currentStep: number;
}

const steps = [
  { label: 'Concept', icon: '◆' },
  { label: 'Configure', icon: '⚙' },
  { label: 'Script', icon: '📝' },
  { label: 'Production', icon: '🎬' }
];

export const StepIndicator: React.FC<Props> = ({ currentStep }) => {
  return (
    <div className="flex flex-col items-center w-full mb-4">
      {/* Steps row */}
      <div className="flex items-center justify-center">
        {steps.map(({ label, icon }, idx) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  idx < currentStep 
                    ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                    : idx === currentStep 
                      ? 'bg-dlm-accent text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
                      : 'bg-dlm-800 border border-dlm-600 text-gray-500'
                }`}
              >
                {idx < currentStep ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span className={`mt-2 text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                idx <= currentStep ? 'text-dlm-accent' : 'text-gray-600'
              }`}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-16 md:w-20 h-0.5 mx-2 md:mx-3 mb-6 transition-colors duration-300 ${
                idx < currentStep ? 'bg-green-500' : 'bg-dlm-700'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
