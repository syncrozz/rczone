import React, { useState } from 'react';

export const DIRECT_ASSET_ICONS: Record<string, string> = {
  bulldozer: 'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/icon/RCZone/RCZONE.Bulldozer.png',
  dumptruck: 'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/icon/RCZone/RCZONE.DumpTruck.png',
  'dump truck': 'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/icon/RCZone/RCZONE.DumpTruck.png',
  excavator: 'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/icon/RCZone/RCZONE.Excavator.png',
};

export const isImageUrl = (icon?: string): boolean => {
  if (!icon) return false;
  const str = icon.trim();
  return (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('/') ||
    str.startsWith('data:image/') ||
    str.endsWith('.png') ||
    str.endsWith('.jpg') ||
    str.endsWith('.jpeg') ||
    str.endsWith('.svg') ||
    str.endsWith('.webp')
  );
};

export function getResolvedAssetIcon(icon?: string, nameOrType?: string): string {
  if (icon && isImageUrl(icon)) {
    return icon;
  }
  const key = (nameOrType || '').trim().toLowerCase();
  if (DIRECT_ASSET_ICONS[key]) {
    return DIRECT_ASSET_ICONS[key];
  }
  if (key.includes('excavator') || icon === '🚜') {
    return DIRECT_ASSET_ICONS.excavator;
  }
  if (key.includes('bulldozer') || icon === '🚧') {
    return DIRECT_ASSET_ICONS.bulldozer;
  }
  if (key.includes('dump') || icon === '🚛') {
    return DIRECT_ASSET_ICONS.dumptruck;
  }
  return icon || '🏎️';
}

interface AssetIconProps {
  icon?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallbackEmoji?: string;
}

export function AssetIcon({
  icon,
  name,
  className = '',
  size = 'md',
  fallbackEmoji = '🏎️',
}: AssetIconProps) {
  const [hasError, setHasError] = useState(false);
  const resolved = getResolvedAssetIcon(icon, name);
  const isImage = !hasError && isImageUrl(resolved);

  if (isImage) {
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-9 h-9',
      lg: 'w-11 h-11',
      xl: 'w-14 h-14',
      '2xl': 'w-16 h-16',
    }[size];

    return (
      <img
        src={resolved}
        alt={name || 'Machine'}
        className={`object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] inline-block shrink-0 transition-transform ${sizeClasses} ${className}`}
        referrerPolicy="no-referrer"
        loading="eager"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <span className={`filter drop-shadow inline-flex items-center justify-center shrink-0 leading-none ${className}`}>
      {resolved || fallbackEmoji}
    </span>
  );
}
