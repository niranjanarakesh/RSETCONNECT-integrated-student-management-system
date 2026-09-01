import React from 'react';
import defaultAvatarSvg from '../assets/images/default_student_avatar.svg';

interface StudentAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  src,
  name = 'Student',
  size = 48,
  style = {},
  className = '',
}) => {
  const avatarSrc = src && src !== '/assets/student_brinda.png' && !src.includes('student_brinda')
    ? src
    : defaultAvatarSvg;

  return (
    <div
      className={className}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={avatarSrc}
        alt={`Profile of ${name}`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = defaultAvatarSvg;
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
};
