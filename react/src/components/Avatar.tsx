import React, { useState } from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'rounded' | 'circle';

export interface AvatarProps {
  /** Image URL. If it is missing or fails to load, the initials are shown. */
  src?: string;
  /** Person's name: used for the accessible label and for the initials fallback. */
  name: string;
  size?: AvatarSize;
  /** `rounded` = the live site's 8px square-ish avatar (default); `circle` = fully round. */
  shape?: AvatarShape;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE: Record<AvatarSize, string> = {
  sm: 'var(--vs-avatar-size-sm)',
  md: 'var(--vs-avatar-size-md)',
  lg: 'var(--vs-avatar-size-lg)',
  xl: 'var(--vs-avatar-size-xl)',
};

/* Font size scales with the box so initials stay readable at every size. */
const INITIALS_FONT: Record<AvatarSize, string> = {
  sm: '12px',
  md: '18px',
  lg: '26px',
  xl: '34px',
};

/** First letters of the first two words (or the first two letters of one word), upper-cased. */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return Array.from(words[0]).slice(0, 2).join('').toUpperCase();
  return (Array.from(words[0])[0] + Array.from(words[1])[0]).toUpperCase();
}

/**
 * VectorSticker Avatar — image with an initials fallback. The initials sit on the brand green with
 * the on-primary text colour (6.79:1), never white (2.78:1). The wrapper is role="img" with the
 * person's name as its label; the inner <img> is decorative (alt="") so the name is read once.
 */
export function Avatar({ src, name, size = 'md', shape = 'rounded', className, style }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span
      role="img"
      aria-label={name}
      className={className ? `vs-avatar ${className}` : 'vs-avatar'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: SIZE[size],
        height: SIZE[size],
        borderRadius: shape === 'circle' ? 'var(--vs-radius-full)' : 'var(--vs-avatar-radius)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: showImage ? 'var(--vs-color-disabled-bg)' : 'var(--vs-color-brand-primary)',
        color: 'var(--vs-color-text-on-primary)',
        fontFamily: 'var(--vs-font-family)',
        fontSize: INITIALS_FONT[size],
        fontWeight: 600,
        lineHeight: 1,
        userSelect: 'none',
        ...style,
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          onError={() => setFailedSrc(src ?? null)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </span>
  );
}
