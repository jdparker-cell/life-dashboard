'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import BentoCard from '@/components/BentoCard';
import { useStore } from '@/lib/store';
import type { AppData } from '@/lib/types';
import { generateMentorAdvice, today as getToday } from '@/lib/utils';

const SUGGESTIONS = [
  'what should I do next?',
  'how am I tracking?',
  'enough protein today?',
  'what should I eat tonight?',
  'how is my gym progress?',
  'what subscriptions are coming up?',
];

const REMINDERS = [
  { label: 'Water' },
  { label: 'Goal' },
  { label: 'Stretch' },
  { label: 'Log food' },
  { label: 'Sleep' },
];

export default function MentorPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="text-white/30 text-xs p-8 text-center">Loading...</div>}>
        <MentorDashboard />
      </Suspense>
    </AppShell>
  );
}

function MentorDashboard() {
  const { data } = useStore();
  const searchParams = useSearchParams();
  const d = getToday();
  const [messages, setMessages] = useState<{ role: 'user' | 'mentor'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [avatarState, setAvatarState] = useState<'idle' | 'blink' | 'sleep' | 'talk' | 'happy' | 'wink' | 'wide'>('idle');
  const [eyeDir, setEyeDir] = useState<'center' | 'left' | 'right' | 'up' | 'down'>('center');
  const [showDesignLab, setShowDesignLab] = useState(false);
  const [customReminder, setCustomReminder] = useState('');
  const [sleepTimer, setSleepTimer] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settings = data.mentorSettings;

  const handleAsk = (question: string) => {
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setAvatarState('talk');
    setEyeDir('center');
    setTimeout(() => {
      const result = generateMentorAdvice(data, d);
      const answer = getResponseForQuestion(question, result, data);
      setMessages(prev => [...prev, { role: 'mentor', text: answer }]);
      setAvatarState('happy');
      setTimeout(() => setAvatarState('idle'), 500);
    }, 400);
  };

  // Handle query param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && messages.length === 0) {
      setTimeout(() => handleAsk(decodeURIComponent(q)), 0);
    } else if (messages.length === 0) {
      setTimeout(() => setMessages([{
        role: 'mentor',
        text: `Hey — I am Nova. I can read your logged goals, food, training, sleep, water, caffeine, and finance data. I keep it short and give you one thing to act on.\n\nTry asking me something!`,
      }]), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Idle → sleep after 6s
  useEffect(() => {
    if (!settings.enableIdleSleep) return;
    const resetTimer = () => {
      setAvatarState('idle');
      setEyeDir('center');
      setSleepTimer(0);
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      inactivityRef.current = setTimeout(() => {
        setAvatarState('sleep');
        intervalRef.current = setInterval(() => {
          setSleepTimer(prev => Math.min(prev + 0.1, 6));
        }, 100);
      }, 6000);
    };
    const events = ['mousemove', 'touchstart', 'keydown', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [settings.enableIdleSleep]);

  // Blink
  useEffect(() => {
    if (!settings.enableBlinking || avatarState === 'sleep') return;
    const blink = setInterval(() => {
      const r = Math.random();
      if (r < 0.6) {
        setAvatarState('blink');
        setTimeout(() => setAvatarState('idle'), 150);
      } else if (r < 0.8) {
        setAvatarState('wink');
        setTimeout(() => setAvatarState('idle'), 300);
      } else if (r < 0.9) {
        const dirs = ['left', 'right', 'up', 'down'] as const;
        setEyeDir(dirs[Math.floor(Math.random() * 4)]);
        setTimeout(() => setEyeDir('center'), 800);
      } else {
        setAvatarState('happy');
        setTimeout(() => setAvatarState('idle'), 600);
      }
    }, 3000);
    return () => clearInterval(blink);
  }, [settings.enableBlinking, avatarState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    handleAsk(input.trim());
    setInput('');
  };

  const handleReminder = (label: string) => {
    const tips: Record<string, string> = {
      Water: 'Time to hydrate! Aim for a glass now.',
      Goal: 'Check your goals — what is one thing you can move forward today?',
      Stretch: 'Stand up and stretch for 2 minutes. Your body will thank you.',
      'Log food': 'Quick reminder to log what you ate. Accuracy matters!',
      Sleep: 'Wind down soon. Consistent sleep timing builds better recovery.',
    };
    setMessages(prev => [...prev, { role: 'mentor', text: `${tips[label] || label}` }]);
  };

  const avatarScale = avatarState === 'sleep' ? 'scale-90 opacity-40' : avatarState === 'talk' ? 'scale-110' : '';
  const eyeStyle = avatarState === 'blink' ? { transform: 'scaleY(0.1)', opacity: 0.8 } :
    avatarState === 'sleep' ? { transform: 'translateY(6px) scaleY(0.3)', opacity: 0.3 } :
    avatarState === 'wink' ? { transform: 'scaleY(0.1)', opacity: 0.8 } :
    avatarState === 'wide' ? { transform: 'scaleY(1.3)' } : {};

  const eyeOffset = eyeDir === 'left' ? -2 : eyeDir === 'right' ? 2 : eyeDir === 'up' ? -2 : eyeDir === 'down' ? 2 : 0;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`nova-avatar w-16 h-16 ${avatarScale} transition-all duration-500 animate-glow-pulse`}
          style={{ background: 'radial-gradient(circle at 30% 30%, rgba(99,240,173,0.3), rgba(99,240,173,0.05) 70%)' }}>
          <div className="nova-face w-10 h-10">
            <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, #63f0ad, transparent)' }} />
            <div className="nova-eye" style={{ width: 10, height: 12, top: 10, left: 6, ...eyeStyle, transform: `translateX(${eyeOffset}px) ${eyeStyle.transform || ''}` }}>
              {avatarState !== 'blink' && avatarState !== 'sleep' && avatarState !== 'wink' && <div className="nova-pupil" />}
            </div>
            <div className="nova-eye" style={{ width: 10, height: 12, top: 10, right: 6, ...eyeStyle, transform: `translateX(${eyeOffset}px) ${eyeStyle.transform || ''}` }}>
              {avatarState !== 'blink' && avatarState !== 'sleep' && avatarState !== 'wink' && <div className="nova-pupil" />}
            </div>
            {avatarState === 'talk' && <div className="nova-mouth-talk" style={{ width: 12, height: 6, bottom: 8 }} />}
            {avatarState === 'happy' && <div className="nova-mouth-happy" style={{ width: 14, height: 6, bottom: 8 }} />}
            {avatarState === 'sleep' && <div className="nova-mouth-sleep" style={{ bottom: -2 }}>zzz</div>}
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-white">Nova Lite</div>
          <div className="text-[9px] text-white/30 tracking-[0.15em] uppercase">Your Mentor</div>
        </div>
        <button onClick={() => setShowDesignLab(!showDesignLab)} className="ml-auto w-7 h-7 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[10px] text-white/30 hover:bg-white/[0.08]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
        </button>
      </div>

      {/* Design Lab */}
      {showDesignLab && (
        <BentoCard sectionLabel="Nova — Behaviors" glow="green">
          <div className="text-[10px] text-white/20 tracking-[0.12em] uppercase mb-4">Eye Animations • Reminder Bubbles • Idle Sleep & Wake</div>

          {/* Center avatar preview */}
          <div className="flex justify-center mb-6">
            <div className="nova-avatar w-20 h-20 animate-glow-pulse" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(99,240,173,0.25), rgba(99,240,173,0.05) 70%)' }}>
              <div className="nova-face w-14 h-14">
                <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, #63f0ad, transparent)' }} />
                <div className="nova-eye" style={{ width: 12, height: 14, top: 12, left: 8 }}><div className="nova-pupil" /></div>
                <div className="nova-eye" style={{ width: 12, height: 14, top: 12, right: 8 }}><div className="nova-pupil" /></div>
                <div className="nova-mouth-happy" style={{ width: 16, height: 8, bottom: 8 }} />
              </div>
            </div>
          </div>

          {/* Eye Animations */}
          <div className="mb-5">
            <div className="section-label mb-2">Eye Animations</div>
            <div className="flex flex-wrap gap-1.5">
              {['Glance left', 'Glance right', 'Up', 'Down', 'Neutral', 'Happy', 'Wink', 'Wide', 'Heart', 'Star'].map(a => {
                const action = a.toLowerCase().replace(' ', '');
                return (
                  <button key={a} onClick={() => {
                    if (action === 'glanceleft') setEyeDir('left');
                    else if (action === 'glanceright') setEyeDir('right');
                    else if (action === 'up') setEyeDir('up');
                    else if (action === 'down') setEyeDir('down');
                    else if (action === 'neutral') setEyeDir('center');
                    else if (action === 'happy') { setAvatarState('happy'); setTimeout(() => setAvatarState('idle'), 600); }
                    else if (action === 'wink') { setAvatarState('wink'); setTimeout(() => setAvatarState('idle'), 300); }
                    else if (action === 'wide') { setAvatarState('wide'); setTimeout(() => setAvatarState('idle'), 500); }
                    else if (action === 'heart') setAvatarState('happy');
                    else if (action === 'star') setAvatarState('happy');
                    if (['glanceleft', 'glanceright', 'up', 'down', 'neutral'].includes(action)) {
                      setTimeout(() => setEyeDir('center'), 1000);
                    }
                  }} className="text-[9px] px-2.5 py-1.5 rounded-full bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70 transition-all">
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reminder Bubbles */}
          <div className="mb-5">
            <div className="section-label mb-2">Reminder Bubbles</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {REMINDERS.map(r => (
                <button key={r.label} onClick={() => handleReminder(r.label)}
                  className="reminder-bubble text-xs">
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={customReminder} onChange={e => setCustomReminder(e.target.value)} placeholder="Custom reminder..." className="flex-1 text-xs" />
              <button onClick={() => { if (customReminder.trim()) { handleReminder(customReminder.trim()); setCustomReminder(''); } }} className="btn-green text-xs">Send</button>
            </div>
          </div>

          {/* Idle Sleep & Wake */}
          <div>
            <div className="section-label mb-2">Idle • Sleep & Wake</div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => { setAvatarState('sleep'); if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current = setInterval(() => setSleepTimer(prev => Math.min(prev + 0.1, 6)), 100); }} className="btn-ghost text-xs">Sleep now</button>
              <button onClick={() => { setAvatarState('idle'); setEyeDir('center'); setSleepTimer(0); if (intervalRef.current) clearInterval(intervalRef.current); }} className="btn-ghost text-xs">Wake up</button>
            </div>
            <div className="text-[10px] text-white/20 font-mono">Idle {sleepTimer.toFixed(1)}s — sleeps at 6.0s</div>
          </div>
        </BentoCard>
      )}

      {/* Message card */}
      <BentoCard glow="green">
        <div className="nova-pill">NOVA</div>

        {/* Chat */}
        <div className="space-y-3 max-h-72 overflow-y-auto mb-3 scroll-smooth">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] p-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#63f0ad]/10 text-[#63f0ad]/90 rounded-br-md'
                  : 'bg-white/[0.04] text-white/70 rounded-bl-md border border-white/[0.04]'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => handleAsk(s)}
              className="text-[9px] px-2.5 py-1.5 rounded-full bg-white/[0.04] text-white/40 hover:bg-[#63f0ad]/10 hover:text-[#63f0ad]/70 transition-all whitespace-nowrap">
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="ask Nova anything…"
            className="flex-1 text-sm rounded-2xl"
          />
          <button onClick={handleSend} className="btn-green w-10 h-10 p-0 flex items-center justify-center rounded-2xl">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </BentoCard>

      {/* Reminder bubbles row */}
      <div className="flex flex-wrap gap-2 justify-center">
        {REMINDERS.map(r => (
          <button key={r.label} onClick={() => handleReminder(r.label)}
            className="reminder-bubble">
            {r.label}
          </button>
        ))}
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-2 gap-2">
        <InsightCard label="Tasks" value={data.tasks.filter(t => t.date === d && !t.completed).length.toString() || '0'} sub="remaining" color="#63f0ad" />
        <InsightCard label="Water" value={`${Math.round(data.waterLogs.filter(l => l.date === d).reduce((s, l) => s + l.amount, 0) / 100) / 10}L`} sub="today" color="#2dd4bf" />
        <InsightCard label="Gym" value={data.workoutSessions.filter(s => s.date === d).length > 0 ? 'Done' : '—'} sub="today" color="#63f0ad" />
        <InsightCard label="Caffeine" value={`${data.caffeineLogs.filter(l => l.date === d).reduce((s, l) => s + l.caffeineMg, 0)}mg`} sub="today" color="#f59e0b" />
      </div>
    </div>
  );
}

function InsightCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="text-[9px] text-white/30 tracking-wider uppercase">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      <div className="text-[9px] text-white/25">{sub}</div>
    </div>
  );
}

function getResponseForQuestion(question: string, advice: { response: string; insights: string[] }, appData?: AppData): string {
  const q = question.toLowerCase();

  if (q.includes('next') || q.includes('focus on') || q.includes('do next')) {
    return advice.insights[0] || "You're all caught up! No urgent tasks right now.";
  }
  if (q.includes('tracking') || q.includes('how am i') || q.includes('overview')) {
    return advice.insights.slice(0, 3).join('\n\n') || 'Log some data and I can give you a status update!';
  }
  if (q.includes('protein')) {
    const d = getToday();
    if (appData) {
      const todayFood = appData.foodLogs.filter(f => f.date === d);
      const protein = todayFood.reduce((s, f) => s + f.protein, 0);
      const goal = appData.profile?.macroGoals?.protein || 180;
      return `You've logged ${Math.round(protein)}g protein today (goal: ${goal}g). ${protein >= goal ? 'Nice, you hit your target!' : protein >= goal * 0.7 ? 'Getting there — keep going!' : 'Still need more. Try adding a protein source to your next meal.'}`;
    }
    return 'Log your food and I can track your protein intake!';
  }
  if (q.includes('eat tonight')) {
    const d = getToday();
    if (appData) {
      const todayFood = appData.foodLogs.filter(f => f.date === d);
      const protein = todayFood.reduce((s, f) => s + f.protein, 0);
      const carbs = todayFood.reduce((s, f) => s + f.carbs, 0);
      const goal = appData.profile?.macroGoals;
      if (goal) {
        const remainingProtein = Math.max(0, goal.protein - protein);
        const remainingCarbs = Math.max(0, goal.carbs - carbs);
        if (remainingProtein > 30) return `You still need about ${Math.round(remainingProtein)}g protein. Something like chicken, fish, or tofu would round out your macros well tonight.`;
        if (remainingCarbs > 50) return `You could use some carbs — rice, potatoes, or whole grains would fit well.`;
        return 'Your macros look balanced tonight. Keep it simple and whole-food based!';
      }
    }
    return 'Log some food and I can suggest what to eat tonight!';
  }
  if (q.includes('gym') || q.includes('workout') || q.includes('progress')) {
    const gymInsight = advice.insights.find(i => i.includes('strength') || i.includes('gym') || i.includes('workout') || i.includes('progressive'));
    return gymInsight || 'No gym data yet. Start logging your workouts for personalized advice.';
  }
  if (q.includes('sleep')) {
    const sleepInsight = advice.insights.find(i => i.includes('sleep') || i.includes('bedtime') || i.includes('debt'));
    return sleepInsight || 'Log your sleep to get insights and recommendations.';
  }
  if (q.includes('water') || q.includes('hydrat')) {
    const waterInsight = advice.insights.find(i => i.includes('water') || i.includes('bottle'));
    return waterInsight || 'No water data logged today. Stay hydrated!';
  }
  if (q.includes('subscription') || q.includes('cancel') || q.includes('sub')) {
    const subInsights = advice.insights.filter(i => i.includes('renew') || i.includes('subscription') || i.includes('marked'));
    return subInsights.length > 0 ? subInsights.join('\n\n') : 'No upcoming subscriptions or cancellations to review.';
  }
  if (q.includes('afford') || q.includes('wishlist') || q.includes('buy')) {
    const wishInsight = advice.insights.find(i => i.includes('wishlist'));
    return wishInsight || 'Check your wishlist or finance settings for affordability insights.';
  }
  if (q.includes('finance') || q.includes('money') || q.includes('net worth')) {
    const financeInsight = advice.insights.find(i => i.includes('net worth') || i.includes('subscription') || i.includes('month'));
    return financeInsight || 'Start tracking your finances for personalized advice.';
  }
  if (q.includes('deep work') || q.includes('focus')) {
    return 'For deep work, find a time when your energy and focus are highest. Log caffeine and readiness to identify your peak window.';
  }

  return advice.response || "I'm not sure how to answer that yet. Try one of the suggested questions above!";
}
