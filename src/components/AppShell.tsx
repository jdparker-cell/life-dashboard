'use client';

import { ReactNode } from 'react';
import { StoreProvider } from '@/lib/store';
import BottomNav from './BottomNav';
import TopTicker from './TopTicker';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <div className="star-bg" />
      <div className="relative z-10 min-h-screen text-white pb-20 pt-8">
        <TopTicker />
        <main className="max-w-3xl mx-auto px-4 pt-2">
          {children}
        </main>
        <BottomNav />
      </div>
    </StoreProvider>
  );
}
