'use client';

// ========================================
// DLM DIRECTOR - MOTION COMPONENTS
// Reusable animation primitives with Framer Motion
// ========================================

import React, { ReactNode } from 'react';
import { 
  motion, 
  AnimatePresence, 
  Variants,
  HTMLMotionProps,
  MotionProps
} from 'framer-motion';

// ========================================
// ANIMATION VARIANTS
// ========================================

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

export const fadeInDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.2 } }
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// ========================================
// FADE IN COMPONENT
// ========================================

interface FadeInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  direction = 'up',
  className = '',
  ...props 
}) => {
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
    none: {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ========================================
// SCALE IN COMPONENT
// ========================================

interface ScaleInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ 
  children, 
  delay = 0, 
  className = '',
  ...props 
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ 
      duration: 0.3, 
      delay,
      ease: [0.25, 0.46, 0.45, 0.94]
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// ========================================
// STAGGER CONTAINER
// ========================================

interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({ 
  children, 
  staggerDelay = 0.05,
  initialDelay = 0.1,
  className = '',
  ...props 
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: initialDelay
        }
      }
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// ========================================
// STAGGER ITEM
// ========================================

interface StaggerItemProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({ 
  children, 
  className = '',
  ...props 
}) => (
  <motion.div
    variants={staggerItemVariants}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// ========================================
// HOVER SCALE
// ========================================

interface HoverScaleProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  scale?: number;
  className?: string;
}

export const HoverScale: React.FC<HoverScaleProps> = ({ 
  children, 
  scale = 1.02, 
  className = '',
  ...props 
}) => (
  <motion.div
    whileHover={{ scale }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// ========================================
// HOVER LIFT
// ========================================

interface HoverLiftProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  lift?: number;
  className?: string;
}

export const HoverLift: React.FC<HoverLiftProps> = ({ 
  children, 
  lift = -4, 
  className = '',
  ...props 
}) => (
  <motion.div
    whileHover={{ y: lift }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// ========================================
// GLOW CARD
// ========================================

interface GlowCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  glowColor?: string;
  className?: string;
}

export const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  glowColor = 'rgba(212, 175, 55, 0.3)',
  className = '',
  ...props 
}) => (
  <motion.div
    whileHover={{ 
      boxShadow: `0 0 30px ${glowColor}`,
      borderColor: 'rgba(212, 175, 55, 0.4)'
    }}
    transition={{ duration: 0.3 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// ========================================
// ANIMATED TEXT - Character by character
// ========================================

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  text, 
  className = '',
  delay = 0,
  staggerDelay = 0.03
}) => {
  const words = text.split(' ');

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay
      }
    }
  };

  const child: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100
      }
    }
  };

  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="visible"
      className={`inline-flex flex-wrap ${className}`}
    >
      {words.map((word, i) => (
        <motion.span key={i} variants={child} className="mr-[0.25em]">
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

// ========================================
// ANIMATED COUNTER
// ========================================

interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  className = '',
  duration = 1
}) => (
  <motion.span
    key={value}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    className={className}
  >
    {value}
  </motion.span>
);

// ========================================
// EXPAND COLLAPSE
// ========================================

interface ExpandCollapseProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}

export const ExpandCollapse: React.FC<ExpandCollapseProps> = ({ 
  isOpen, 
  children, 
  className = '' 
}) => (
  <AnimatePresence initial={false}>
    {isOpen && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`overflow-hidden ${className}`}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// ========================================
// MODAL OVERLAY
// ========================================

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export const ModalOverlay: React.FC<ModalOverlayProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  className = '' 
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10"
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ========================================
// PULSE INDICATOR
// ========================================

interface PulseIndicatorProps {
  color?: string;
  size?: number;
  className?: string;
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({ 
  color = '#D4AF37', 
  size = 8,
  className = '' 
}) => (
  <span className={`relative inline-flex ${className}`}>
    <motion.span
      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: color,
        borderRadius: '50%',
        position: 'absolute',
        inset: 0
      }}
    />
    <span 
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: color,
        borderRadius: '50%',
        position: 'relative'
      }}
    />
  </span>
);

// ========================================
// SHIMMER BUTTON
// ========================================

interface ShimmerButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
  className?: string;
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({ 
  children, 
  className = '',
  ...props 
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`relative overflow-hidden ${className}`}
    {...props}
  >
    <motion.span
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      initial={{ x: '-100%' }}
      whileHover={{ x: '100%' }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    />
    {children}
  </motion.button>
);

// ========================================
// ICON BUTTON
// ========================================

interface IconButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  children, 
  className = '',
  ...props 
}) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    className={className}
    {...props}
  >
    {children}
  </motion.button>
);

// ========================================
// PROGRESS LINE
// ========================================

interface ProgressLineProps {
  progress: number; // 0-100
  className?: string;
  glowColor?: string;
}

export const ProgressLine: React.FC<ProgressLineProps> = ({ 
  progress, 
  className = '',
  glowColor = 'rgba(212, 175, 55, 0.5)'
}) => (
  <div className={`relative h-1 bg-white/10 rounded-full overflow-hidden ${className}`}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute h-full rounded-full"
      style={{ 
        background: 'linear-gradient(90deg, #D4AF37 0%, #E8C547 100%)',
        boxShadow: `0 0 10px ${glowColor}`
      }}
    />
  </div>
);

// ========================================
// LOADING SPINNER
// ========================================

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 20, 
  color = '#D4AF37',
  className = '' 
}) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="31.416"
      strokeDashoffset="10"
    />
  </motion.svg>
);

// Re-export AnimatePresence for convenience
export { AnimatePresence, motion };
