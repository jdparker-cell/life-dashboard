'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { generateTickerAlerts, today } from '@/lib/utils';

export default function TopTicker() {
  const { data } = useStore();
  const [alerts, setAlerts] = useState<ReturnType<typeof generateTickerAlerts>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const d = today();
    const result = generateTickerAlerts(data, d);
    setAlerts(result);
  }, [data]);

  useEffect(() => {
    if (alerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % alerts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [alerts.length]);

  if (alerts.length === 0) return null;

  const current = alerts[currentIndex % alerts.length];
  if (!current) return null;

  const typeColors: Record<string, string> = {
    urgent: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-cyan-400',
    positive: 'text-green-400',
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10 overflow-hidden">
      <div className="flex items-center h-8 px-3 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 w-full justify-center">
          <span className="text-xs font-mono text-white/30">LIFE▼</span>
          <span className={`text-xs font-mono truncate animate-fadeIn ${typeColors[current.type] || 'text-white/70'}`}>
            {current.text}
          </span>
          {alerts.length > 1 && (
            <span className="text-[10px] text-white/20 font-mono shrink-0">
              {currentIndex + 1}/{alerts.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
