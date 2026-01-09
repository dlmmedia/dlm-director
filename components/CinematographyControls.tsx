// ========================================
// CINEMATOGRAPHY CONTROLS COMPONENT
// Camera, lens, lighting, and movement controls
// ========================================

import React from 'react';
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

// Icons
const CameraIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const LightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const MovementIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LensIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const CinematographyControls: React.FC<Props> = ({ scene, onChange, compact = false }) => {
  const baseInputClass = "w-full bg-dlm-900 border border-dlm-600 rounded px-2 py-1.5 text-white text-xs focus:border-dlm-accent outline-none";
  const labelClass = "block text-[10px] text-gray-500 uppercase tracking-wide mb-1";
  
  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-2 p-2 bg-dlm-800/50 rounded border border-dlm-700/50">
        <div>
          <select
            value={scene.shotType}
            onChange={(e) => onChange({ shotType: e.target.value as ShotType })}
            className={baseInputClass}
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
            className={baseInputClass}
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
            className={baseInputClass}
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
            className={baseInputClass}
            title="Lighting"
          >
            {Object.values(LightingStyle).map(style => (
              <option key={style} value={style}>{style.split(' ')[0]}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-dlm-800/50 rounded-lg border border-dlm-700">
      {/* Shot & Composition */}
      <div>
        <h4 className="text-xs font-semibold text-dlm-accent flex items-center gap-1 mb-3">
          <CameraIcon /> Shot & Composition
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Shot Type</label>
            <select
              value={scene.shotType}
              onChange={(e) => onChange({ shotType: e.target.value as ShotType })}
              className={baseInputClass}
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
              className={baseInputClass}
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
        <h4 className="text-xs font-semibold text-blue-400 flex items-center gap-1 mb-3">
          <LensIcon /> Lens & Focus
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Focal Length</label>
            <select
              value={scene.focalLength}
              onChange={(e) => onChange({ focalLength: e.target.value as FocalLength })}
              className={baseInputClass}
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
              className={baseInputClass}
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
        <h4 className="text-xs font-semibold text-green-400 flex items-center gap-1 mb-3">
          <MovementIcon /> Camera Movement
        </h4>
        <select
          value={scene.cameraMovement}
          onChange={(e) => onChange({ cameraMovement: e.target.value as CameraMovement })}
          className={baseInputClass}
        >
          {Object.values(CameraMovement).map(movement => (
            <option key={movement} value={movement}>{movement}</option>
          ))}
        </select>
      </div>

      {/* Lighting */}
      <div>
        <h4 className="text-xs font-semibold text-yellow-400 flex items-center gap-1 mb-3">
          <LightIcon /> Lighting
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Style</label>
            <select
              value={scene.lightingStyle}
              onChange={(e) => onChange({ lightingStyle: e.target.value as LightingStyle })}
              className={baseInputClass}
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
              className={baseInputClass}
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
        <h4 className="text-xs font-semibold text-purple-400 mb-3">Transitions</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>In</label>
            <select
              value={scene.transitionIn || TransitionType.CUT}
              onChange={(e) => onChange({ transitionIn: e.target.value as TransitionType })}
              className={baseInputClass}
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
              className={baseInputClass}
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
        <label className={labelClass}>Duration (seconds)</label>
        <input
          type="number"
          min={2}
          max={10}
          value={scene.durationEstimate}
          onChange={(e) => onChange({ durationEstimate: parseInt(e.target.value) || 4 })}
          className={baseInputClass}
        />
      </div>
    </div>
  );
};

// Quick preset buttons for common shot configurations
export const ShotPresets: React.FC<{ onApply: (preset: Partial<Scene>) => void }> = ({ onApply }) => {
  const presets = [
    {
      name: 'Establishing',
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
      {presets.map(({ name, preset }) => (
        <button
          key={name}
          onClick={() => onApply(preset)}
          className="px-3 py-1 text-xs bg-dlm-700 hover:bg-dlm-600 text-gray-300 hover:text-white rounded transition-colors"
        >
          {name}
        </button>
      ))}
    </div>
  );
};
