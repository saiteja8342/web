import React from 'react';

export default function NoiseBackground({
  children,
  gradientColors = [],
  containerClassName = '',
}) {
  const gradientStyle = gradientColors.length > 0
    ? { background: `linear-gradient(135deg, ${gradientColors.join(', ')})` }
    : {};

  return (
    <div 
      className={`noise-bg-container ${containerClassName}`} 
      style={gradientStyle}
    >
      <div className="noise-bg-overlay" />
      <div className="noise-bg-content">
        {children}
      </div>
    </div>
  );
}
