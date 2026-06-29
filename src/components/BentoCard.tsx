'use client';

import { ReactNode } from 'react';

interface BentoCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  accent?: string;
  onClick?: () => void;
  action?: ReactNode;
  compact?: boolean;
  glow?: 'green' | 'purple' | 'cyan' | 'amber' | 'pink';
  number?: string;
  sectionLabel?: string;
}

export default function BentoCard({ title, subtitle, children, className = '', accent, onClick, action, compact, glow, number, sectionLabel }: BentoCardProps) {
  const glowClass = glow ? `card-glow-${glow}` : '';
  return (
    <div
      onClick={onClick}
      className={`bento-card p-5 ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${glowClass} ${className}`}
      style={accent ? { borderColor: accent + '30' } : undefined}
    >
      {number && <div className="numbered-label mb-2">{number}</div>}
      {sectionLabel && <div className="section-label">{sectionLabel}</div>}
      {accent && <div className="glow-bar mb-3" style={{ '--bar-color': accent } as React.CSSProperties} />}
      {(title || action) && (
        <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-3'}`}>
          <div>
            {title && <h3 className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>{title}</h3>}
            {subtitle && <p className="text-[11px] text-white/40 mt-0.5 font-mono">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
