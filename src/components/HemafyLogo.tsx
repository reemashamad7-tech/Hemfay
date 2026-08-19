import React from 'react';

interface LogoProps {
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  customSize?: number;
}

export const HemafyLogo: React.FC<LogoProps> = ({
  iconOnly = false,
  size = 'md',
  className = '',
  iconClassName = '',
  textClassName = '',
  customSize
}) => {
  // Sizing definitions matching the official logo proportions (546 x 491, ~1.11 aspect ratio)
  const sizeMap = {
    sm: { icon: 28, fullWidth: 70, fullHeight: 63 },
    md: { icon: 38, fullWidth: 100, fullHeight: 90 },
    lg: { icon: 50, fullWidth: 130, fullHeight: 117 },
    xl: { icon: 80, fullWidth: 200, fullHeight: 180 },
    custom: { icon: customSize || 38, fullWidth: customSize ? customSize * 2.6 : 100, fullHeight: customSize ? customSize * 2.3 : 90 }
  };

  const currentSize = sizeMap[size];

  if (iconOnly) {
    const iconWidthHeight = currentSize.icon;
    return (
      <div
        className={`relative overflow-hidden shrink-0 rounded-full bg-white flex items-center justify-center ${iconClassName} ${className}`}
        style={{
          width: iconWidthHeight,
          height: iconWidthHeight,
        }}
      >
        <img
          src="/hemfay-icon.png"
          alt="Hemfay Icon"
          className="object-contain"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center select-none shrink-0 ${textClassName} ${className}`}>
      <img
        src="/hemafy-logo.png"
        alt="Hemafy Logo"
        className="object-contain"
        style={{
          width: currentSize.fullWidth,
          height: currentSize.fullHeight,
        }}
      />
    </div>
  );
};

export default HemafyLogo;

