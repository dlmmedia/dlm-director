'use client';

// ========================================
// CINEMATOGRAPHY CONTROLS COMPONENT
// Premium camera, lens, lighting, and movement controls
// ========================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  Scene,
  ShotType,
  CameraAngle,
  CameraMovement,
  LightingStyle,
  LightSource,
  FocalLength,
  DepthOfField,
  TransitionType
} from '../types';

interface Props {
  scene: Scene;
  onChange: (updates: Partial<Scene>) => void;
  compact?: boolean;
}

// Icons with refined styling
const CameraIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const LightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const MovementIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LensIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const TransitionIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const TimerIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const CinematographyControls: React.FC<Props> = ({ scene, onChange, compact = false }) => {
  const inputClass = "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-xs focus:border-dlm-accent focus:ring-1 focus:ring-dlm-accent/30 outline-none transition-all appearance-none cursor-pointer hover:border-white/[0.15]";
  const labelClass = "block text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1.5";
  
  const selectStyles = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1rem',
    paddingRight: '2rem'
  };
  
  if (compact) {
    return (
      <motion.div 
        className="grid grid-cols-4 gap-2 p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div>
          <select
            value={scene.shotType}
            onChange={(e) => onChange({ shotType: e.target.value as ShotType })}
            className={inputClass}
            style={selectStyles}
            title="Shot Type"
          >
            {Object.values(ShotType).map(type => (
              <option key={type} value={type}>{type.split(' ')[0]}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={scene.cameraAngle}
            onChange={(e) => onChange({ cameraAngle: e.target.value as CameraAngle })}
            className={inputClass}
            style={selectStyles}
            title="Camera Angle"
          >
            {Object.values(CameraAngle).map(angle => (
              <option key={angle} value={angle}>{angle.split(' ')[0]}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={scene.cameraMovement}
            onChange={(e) => onChange({ cameraMovement: e.target.value as CameraMovement })}
            className={inputClass}
            style={selectStyles}
            title="Camera Movement"
          >
            {Object.values(CameraMovement).map(movement => (
              <option key={movement} value={movement}>{movement.split(' ')[0]}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={scene.lightingStyle}
            onChange={(e) => onChange({ lightingStyle: e.target.value as LightingStyle })}
            className={inputClass}
            style={selectStyles}
            title="Lighting"
          >
            {Object.values(LightingStyle).map(style => (
              <option key={style} value={style}>{style.split(' ')[0]}</option>
            ))}
          </select>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-5 p-5 bg-white/[0.02] rounded-xl border border-white/[0.06]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Shot & Composition */}
      <div>
        <h4 className="text-xs font-semibold text-dlm-accent flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-md bg-dlm-accent/20 flex items-center justify-center">
            <CameraIcon />
          </span>
          Shot & Composition
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Shot Type</label>
            <select
              value={scene.shotType}
              onChange={(e) => onChange({ shotType: e.target.value as ShotType })}
              className={inputClass}
              style={selectStyles}
            >
              {Object.values(ShotType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Camera Angle</label>
            <select
              value={scene.cameraAngle}
              onChange={(e) => onChange({ cameraAngle: e.target.value as CameraAngle })}
              className={inputClass}
              style={selectStyles}
            >
              {Object.values(CameraAngle).map(angle => (
                <option key={angle} value={angle}>{angle}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lens & Focus */}
      <div>
        <h4 className="text-xs font-semibold text-blue-400 flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center">
            <LensIcon />
          </span>
          Lens & Focus
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Focal Length</label>
            <select
              value={scene.focalLength}
              onChange={(e) => onChange({ focalLength: e.target.value as FocalLength })}
              className={inputClass}
              style={selectStyles}
            >
              {Object.values(FocalLength).map(fl => (
                <option key={fl} value={fl}>{fl}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Depth of Field</label>
            <select
              value={scene.depthOfField}
              onChange={(e) => onChange({ depthOfField: e.target.value as DepthOfField })}
              className={inputClass}
              style={selectStyles}
            >
              {Object.values(DepthOfField).map(dof => (
                <option key={dof} value={dof}>{dof}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Camera Movement */}
      <div>
        <h4 className="text-xs font-semibold text-green-400 flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-md bg-green-500/20 flex items-center justify-center">
            <MovementIcon />
          </span>
          Camera Movement
        </h4>
        <select
          value={scene.cameraMovement}
          onChange={(e) => onChange({ cameraMovement: e.target.value as CameraMovement })}
          className={inputClass}
          style={selectStyles}
        >
          {Object.values(CameraMovement).map(movement => (
            <option key={movement} value={movement}>{movement}</option>
          ))}
        </select>
      </div>

      {/* Lighting */}
      <div>
        <h4 className="text-xs font-semibold text-yellow-400 flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-md bg-yellow-500/20 flex items-center justify-center">
            <LightIcon />
          </span>
          Lighting
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Style</label>
            <select
              value={scene.lightingStyle}
              onChange={(e) => onChange({ lightingStyle: e.target.value as LightingStyle })}
              className={inputClass}
              style={selectStyles}
            >
              {Object.values(LightingStyle).map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Source</label>
            <select
              value={scene.lightSource}
              onChange={(e) => onChange({ lightSource: e.target.value as LightSource })}
              className={inputClass}
              style={selectStyles}
            >
              {Object.values(LightSource).map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transitions */}
      <div>
        <h4 className="text-xs font-semibold text-purple-400 flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center">
            <TransitionIcon />
          </span>
          Transitions
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>In</label>
            <select
              value={scene.transitionIn || TransitionType.CUT}
              onChange={(e) => onChange({ transitionIn: e.target.value as TransitionType })}
              className={inputClass}
              style={selectStyles}
            >
              {Object.values(TransitionType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Out</label>
            <select
              value={scene.transitionOut || TransitionType.CUT}
              onChange={(e) => onChange({ transitionOut: e.target.value as TransitionType })}
              className={inputClass}
              style={selectStyles}
            >
              {Object.values(TransitionType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Duration */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-md bg-white/[0.05] flex items-center justify-center">
            <TimerIcon />
          </span>
          Duration
        </h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={2}
            max={10}
            value={scene.durationEstimate}
            onChange={(e) => onChange({ durationEstimate: parseInt(e.target.value) || 10 })}
            className="flex-1 h-2 bg-white/[0.05] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-dlm-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
          />
          <span className="text-sm font-mono text-dlm-accent font-semibold w-12 text-right">
            {scene.durationEstimate}s
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Quick preset buttons for common shot configurations
export const ShotPresets: React.FC<{ onApply: (preset: Partial<Scene>) => void }> = ({ onApply }) => {
  const presets = [
    {
      name: 'Establishing',
      color: 'from-blue-500/20 to-cyan-500/20',
      textColor: 'text-blue-400',
      preset: {
        shotType: ShotType.WIDE,
        cameraAngle: CameraAngle.EYE_LEVEL,
        cameraMovement: CameraMovement.CRANE_DOWN,
        focalLength: FocalLength.WIDE_24,
        depthOfField: DepthOfField.DEEP_FOCUS
      }
    },
    {
      name: 'Hero Close-up',
      color: 'from-dlm-accent/20 to-amber-500/20',
      textColor: 'text-dlm-accent',
      preset: {
        shotType: ShotType.CLOSE_UP,
        cameraAngle: CameraAngle.LOW_ANGLE,
        cameraMovement: CameraMovement.SLOW_PUSH_IN,
        focalLength: FocalLength.PORTRAIT_85,
        depthOfField: DepthOfField.EXTREME_SHALLOW
      }
    },
    {
      name: 'Dramatic',
      color: 'from-red-500/20 to-orange-500/20',
      textColor: 'text-red-400',
      preset: {
        shotType: ShotType.MEDIUM,
        cameraAngle: CameraAngle.DUTCH_TILT,
        cameraMovement: CameraMovement.HANDHELD,
        lightingStyle: LightingStyle.LOW_KEY,
        lightSource: LightSource.MIXED
      }
    },
    {
      name: 'Documentary',
      color: 'from-green-500/20 to-emerald-500/20',
      textColor: 'text-green-400',
      preset: {
        shotType: ShotType.MEDIUM_CLOSE,
        cameraAngle: CameraAngle.EYE_LEVEL,
        cameraMovement: CameraMovement.HANDHELD,
        lightingStyle: LightingStyle.SOFT_DIFFUSED,
        lightSource: LightSource.DAYLIGHT
      }
    },
    {
      name: 'Cinematic Wide',
      color: 'from-purple-500/20 to-pink-500/20',
      textColor: 'text-purple-400',
      preset: {
        shotType: ShotType.EXTREME_WIDE,
        cameraAngle: CameraAngle.EYE_LEVEL,
        cameraMovement: CameraMovement.STEADICAM,
        focalLength: FocalLength.ULTRA_WIDE_18,
        depthOfField: DepthOfField.DEEP_FOCUS
      }
    },
    {
      name: 'Intimate',
      color: 'from-pink-500/20 to-rose-500/20',
      textColor: 'text-pink-400',
      preset: {
        shotType: ShotType.EXTREME_CLOSE,
        cameraAngle: CameraAngle.EYE_LEVEL,
        cameraMovement: CameraMovement.STATIC_TRIPOD,
        focalLength: FocalLength.TELEPHOTO_135,
        depthOfField: DepthOfField.EXTREME_SHALLOW
      }
    }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map(({ name, color, textColor, preset }, idx) => (
        <motion.button
          key={name}
          onClick={() => onApply(preset)}
          className={`px-3 py-1.5 text-xs font-medium bg-gradient-to-r ${color} ${textColor} rounded-lg border border-white/[0.05] hover:border-white/[0.15] transition-all`}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
        >
          {name}
        </motion.button>
      ))}
    </div>
  );
};

export default CinematographyControls;
