'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  currentStep: number;
}

const steps = [
  { label: 'Concept', description: 'Define your vision' },
  { label: 'Configure', description: 'Set up parameters' },
  { label: 'Script', description: 'Review scenes' },
  { label: 'Production', description: 'Generate content' }
];

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const StepIndicator: React.FC<Props> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-6xl mx-auto px-6">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-white/10" />
        
        {/* Animated progress line */}
        <motion.div 
          className="absolute top-5 left-0 h-[2px] bg-gradient-to-r from-green-500 via-green-400 to-dlm-accent"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div key={step.label} className="flex flex-col items-center relative z-10">
              {/* Step Circle */}
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-colors duration-300 relative
                  ${isCompleted 
                    ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                    : isCurrent 
                      ? 'bg-dlm-accent text-black border-2 border-dlm-accent'
                      : 'bg-white/5 border border-white/20 text-gray-500'
                  }
                `}
                animate={{
                  boxShadow: isCurrent 
                    ? '0 0 30px rgba(212, 175, 55, 0.4), 0 0 60px rgba(212, 175, 55, 0.2)' 
                    : 'none'
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Pulse ring for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-dlm-accent"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                
                {isCompleted ? <CheckIcon /> : <span>{idx + 1}</span>}
              </motion.div>

              {/* Label */}
              <span 
                className={`
                  mt-3 text-xs font-medium tracking-wide
                  ${isCompleted 
                    ? 'text-green-400'
                    : isCurrent 
                      ? 'text-dlm-accent'
                      : 'text-gray-500'
                  }
                `}
              >
                {step.label}
              </span>

              {/* Description - only show for current */}
              <span 
                className={`
                  mt-1 text-[10px] text-gray-500 hidden md:block
                  transition-opacity duration-300
                  ${isCurrent ? 'opacity-100' : 'opacity-0'}
                `}
              >
                {step.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
