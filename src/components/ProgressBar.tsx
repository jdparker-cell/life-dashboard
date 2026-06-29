'use client';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({ value, max, color = '#06b6d4', bgColor = 'rgba(255,255,255,0.1)', size = 'md', showLabel, label }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-white/60 mb-1">
          <span>{label || `${Math.round(value)}/${Math.round(max)}`}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className={`w-full rounded-full overflow-hidden ${heights[size]}`} style={{ backgroundColor: bgColor }}>
        <div
          className={`rounded-full transition-all duration-500 ease-out ${heights[size]}`}
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
        />
      </div>
    </div>
  );
}
