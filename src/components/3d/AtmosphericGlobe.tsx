'use client';

import React, { useState, useEffect } from 'react';
import { WeatherScene3D } from './WeatherScene3D';
import { GlobeFallback } from './GlobeFallback';
import { WeatherVisualControls } from './WeatherVisualControls';
import { useWeather } from '../../context/WeatherContext';
import {
  WeatherVisualState,
  QualityLevel,
  getVisualConfig,
  mapWeatherConditionToVisualState,
} from '../../types/visualWeather';

interface AtmosphericGlobeProps {
  showControls?: boolean;
  overrideState?: WeatherVisualState;
}

export const AtmosphericGlobe: React.FC<AtmosphericGlobeProps> = ({
  showControls = true,
  overrideState,
}) => {
  const { weather } = useWeather();
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isAutoMode, setIsAutoMode] = useState(!overrideState);
  const [manualState, setManualState] = useState<WeatherVisualState>(overrideState || 'partly-cloudy');
  const [quality, setQuality] = useState<QualityLevel>('high');

  useEffect(() => {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHasWebGL(false);
      return;
    }

    // Check basic WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
      }
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  // Determine active visual state
  const activeVisualState: WeatherVisualState = isAutoMode
    ? weather
      ? mapWeatherConditionToVisualState(weather.conditionCode)
      : 'partly-cloudy'
    : manualState;

  const visualConfig = getVisualConfig(activeVisualState, quality);

  const handleStateChange = (state: WeatherVisualState) => {
    setIsAutoMode(false);
    setManualState(state);
  };

  const handleToggleAuto = () => {
    setIsAutoMode(!isAutoMode);
  };

  if (!hasWebGL) {
    return <GlobeFallback />;
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* 3D Canvas Engine */}
      <div className="w-full h-full min-h-[340px] flex items-center justify-center">
        <WeatherScene3D config={visualConfig} quality={quality} interactive={true} />
      </div>

      {/* Unobtrusive Demo Weather Controls */}
      {showControls && (
        <div className="w-full px-2 mt-2 z-20">
          <WeatherVisualControls
            activeState={activeVisualState}
            onStateChange={handleStateChange}
            isAutoMode={isAutoMode}
            onToggleAuto={handleToggleAuto}
            quality={quality}
            onQualityChange={setQuality}
          />
        </div>
      )}
    </div>
  );
};
