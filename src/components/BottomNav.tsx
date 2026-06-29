'use client';

import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { id: 'main', label: 'Main', icon: CompassIcon },
  { id: 'food', label: 'Food', icon: FoodIcon },
  { id: 'health', label: 'Health', icon: HeartIcon },
  { id: 'gym', label: 'Gym', icon: DumbbellIcon },
  { id: 'finance', label: 'Finance', icon: DollarIcon },
  { id: 'mentor', label: 'Mentor', icon: SparklesIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const active = pathname?.split('/')[1] || 'main';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#050607]/90 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto px-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => router.push(`/${tab.id === 'main' ? '' : tab.id}`)}
            className={`flex flex-col items-center justify-center py-2 px-1.5 min-w-0 transition-all duration-200 ${
              active === tab.id || (tab.id === 'main' && pathname === '/')
                ? 'text-[#63f0ad] scale-105' : 'text-white/30 hover:text-white/60'
            }`}
          >
            <tab.icon className={`w-4.5 h-4.5 mb-0.5 transition-transform ${active === tab.id || (tab.id === 'main' && pathname === '/') ? 'scale-110' : ''}`} />
            <span className="text-[9px] font-semibold tracking-wide leading-tight">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
}
function FoodIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>;
}
function HeartIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>;
}
function DumbbellIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.5a3 3 0 013-3A3 3 0 0122.5 6.5v1a3 3 0 01-3 3h-1a3 3 0 01-3-3v-1zM1.5 6.5a3 3 0 013-3A3 3 0 017.5 6.5v1a3 3 0 01-3 3h-1a3 3 0 01-3-3v-1zM4.5 10.5v3a3 3 0 003 3h1a3 3 0 003-3 3 3 0 013-3h1a3 3 0 003 3 3 3 0 013 3v3"/></svg>;
}
function DollarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
}
function SparklesIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
}
