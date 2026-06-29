'use client';

import { useState, useRef } from 'react';
import AppShell from '@/components/AppShell';
import BentoCard from '@/components/BentoCard';
import Modal from '@/components/Modal';
import ProgressBar from '@/components/ProgressBar';
import { useStore } from '@/lib/store';
import {
  today, calculateWaterTarget, calculateSleepDebt,
  calculateCaffeineCurve, calculateReadinessScore,
  formatCurrency, generateId
} from '@/lib/utils';
import { Supplement, CaffeineLog, SleepLog, ReadinessLog } from '@/lib/types';

const COMMON_SUPPLEMENTS = [
  { name: 'Creatine Monohydrate', dose: '5', unit: 'g', schedule: 'morning' as const },
  { name: 'Magnesium Glycinate', dose: '200', unit: 'mg', schedule: 'evening' as const },
  { name: 'L-Theanine', dose: '100', unit: 'mg', schedule: 'morning' as const },
  { name: 'Vitamin D', dose: '2000', unit: 'IU', schedule: 'morning' as const },
  { name: 'Omega-3', dose: '1000', unit: 'mg', schedule: 'lunch' as const },
  { name: 'Electrolytes', dose: '1', unit: 'scoop', schedule: 'anytime' as const },
  { name: 'Zinc', dose: '15', unit: 'mg', schedule: 'evening' as const },
  { name: 'Multivitamin', dose: '1', unit: 'tablet', schedule: 'morning' as const },
  { name: 'Protein Powder', dose: '25', unit: 'g', schedule: 'anytime' as const },
  { name: 'Collagen', dose: '10', unit: 'g', schedule: 'morning' as const },
  { name: 'Iron', dose: '18', unit: 'mg', schedule: 'morning' as const },
  { name: 'B12', dose: '1000', unit: 'mcg', schedule: 'morning' as const },
  { name: 'Ashwagandha', dose: '300', unit: 'mg', schedule: 'evening' as const },
];

const COMMON_DRINKS = [
  { name: 'Espresso', caffeine: 63, serving: '1 shot' },
  { name: 'Coffee', caffeine: 95, serving: '1 cup' },
  { name: 'Iced Coffee', caffeine: 80, serving: '1 glass' },
  { name: 'Latte', caffeine: 150, serving: '1 medium' },
  { name: 'Cappuccino', caffeine: 80, serving: '1 cup' },
  { name: 'Energy Drink', caffeine: 150, serving: '1 can' },
  { name: 'Pre-Workout', caffeine: 200, serving: '1 scoop' },
  { name: 'Green Tea', caffeine: 28, serving: '1 cup' },
  { name: 'Black Tea', caffeine: 47, serving: '1 cup' },
  { name: 'Matcha', caffeine: 70, serving: '1 cup' },
  { name: 'Cola', caffeine: 34, serving: '1 can' },
];

export default function HealthPage() {
  return (
    <AppShell>
      <HealthDashboard />
    </AppShell>
  );
}

function HealthDashboard() {
  const { data, addSupplement, updateSupplement, deleteSupplement, toggleSupplement, addWater, addSleep, deleteSleep, addCaffeine, deleteCaffeine, addReadiness } = useStore();
  const hr = useRef(0);
  hr.current++;
  if (hr.current > 1) alert('HealthDashboard render #' + hr.current + ' supplements=' + data.supplements.length);
  const d = today();
  const [tab, setTab] = useState<'supplements' | 'water' | 'sleep' | 'caffeine' | 'readiness'>('supplements');
  const [supModal, setSupModal] = useState(false);
  const [sleepModal, setSleepModal] = useState(false);
  const [cafModal, setCafModal] = useState(false);
  const [readinessModal, setReadinessModal] = useState(false);
  const [newSup, setNewSup] = useState({ name: '', dose: '5', unit: 'g', schedule: 'morning' as Supplement['schedule'], windowStart: '07:00', windowEnd: '10:00', runningLow: false, stockCount: 30, notes: '' });
  const [newSleep, setNewSleep] = useState({ bedtime: '23:00', wakeTime: '07:00', quality: 7, notes: '', isNap: false });
  const [newCaf, setNewCaf] = useState({ drinkName: '', caffeineMg: 95, servingSize: '1 cup', timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), isCustom: false });
  const [newReadiness, setNewReadiness] = useState({ sleepDuration: 0, sleepQuality: 0, caffeineMg: 0, waterProgress: 0, soreness: 5, mood: 7, stress: 4, energy: 7, focus: 7, state: 'neutral' as ReadinessLog['state'], notes: '' });
  const [showAllSupps, setShowAllSupps] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const waterLogs = data.waterLogs.filter(l => l.date === d);
  const waterTotal = waterLogs.reduce((s, l) => s + l.amount, 0);
  const waterTarget = calculateWaterTarget(data.profile);
  const todaySleep = data.sleepLogs.filter(l => l.date === d && !l.isNap);
  const todayCaffeine = data.caffeineLogs.filter(l => l.date === d);
  const totalCaf = todayCaffeine.reduce((s, l) => s + l.caffeineMg, 0);
  const caffeineCurve = calculateCaffeineCurve(todayCaffeine, data.profile.caffeineSensitivity || 'normal');
  const sleepDebt = calculateSleepDebt(data.sleepLogs, data.profile.sleepGoal || 8);
  const lastSleep = data.sleepLogs.filter(l => !l.isNap).slice(-7);
  const bedHour = parseInt((data.profile.bedtimeGoal || '23:00').split(':')[0]);
  const stopCafHour = Math.max(bedHour - 8, 12);

  const handleAddSup = () => {
    if (!newSup.name.trim()) return;
    const scheduleWindows: Record<string, { start: string; end: string }> = {
      morning: { start: '07:00', end: '10:00' },
      lunch: { start: '11:00', end: '14:00' },
      evening: { start: '18:00', end: '22:00' },
      anytime: { start: '07:00', end: '22:00' },
    };
    const win = scheduleWindows[newSup.schedule] || { start: '07:00', end: '22:00' };
    addSupplement({
      name: newSup.name, dose: newSup.dose, unit: newSup.unit,
      schedule: newSup.schedule, windowStart: win.start, windowEnd: win.end,
      notes: newSup.notes, runningLow: newSup.runningLow, stockCount: newSup.stockCount, isCustom: true,
    });
    setNewSup({ name: '', dose: '5', unit: 'g', schedule: 'morning', windowStart: '07:00', windowEnd: '10:00', runningLow: false, stockCount: 30, notes: '' });
    setSupModal(false);
  };

  const handleAddSleep = () => {
    const [bh, bm] = newSleep.bedtime.split(':').map(Number);
    const [wh, wm] = newSleep.wakeTime.split(':').map(Number);
    let duration = wh - bh + (wm - bm) / 60;
    if (duration < 0) duration += 24;
    duration = Math.round(duration * 10) / 10;
    addSleep({
      date: d, bedtime: newSleep.bedtime, wakeTime: newSleep.wakeTime,
      duration, quality: newSleep.quality, notes: newSleep.notes, isNap: newSleep.isNap,
    });
    setNewSleep({ bedtime: '23:00', wakeTime: '07:00', quality: 7, notes: '', isNap: false });
    setSleepModal(false);
  };

  const handleAddCaf = (name: string, mg: number, serving: string) => {
    addCaffeine({
      date: d, drinkName: name, caffeineMg: mg, servingSize: serving,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      isCustom: false,
    });
    setCafModal(false);
  };

  const handleCustomCaf = () => {
    if (!newCaf.drinkName.trim() || !newCaf.caffeineMg) return;
    addCaffeine({
      date: d, drinkName: newCaf.drinkName, caffeineMg: newCaf.caffeineMg,
      servingSize: newCaf.servingSize, timestamp: newCaf.timestamp, isCustom: true,
    });
    setNewCaf({ drinkName: '', caffeineMg: 95, servingSize: '1 cup', timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), isCustom: false });
    setCafModal(false);
  };

  const handleAddReadiness = () => {
    addReadiness({
      date: d, ...newReadiness,
      sleepDuration: lastSleep[0]?.duration || 0,
      sleepQuality: lastSleep[0]?.quality || 0,
      caffeineMg: totalCaf,
      waterProgress: waterTarget > 0 ? waterTotal / waterTarget : 0,
    });
    setReadinessModal(false);
  };

  const supplementSchedule: Record<string, { start: string; end: string; label: string }> = {
    morning: { start: '07:00', end: '10:00', label: 'Morning (7–10 AM)' },
    lunch: { start: '11:00', end: '14:00', label: 'Lunch (11 AM–2 PM)' },
    evening: { start: '18:00', end: '22:00', label: 'Evening (6–10 PM)' },
    anytime: { start: '07:00', end: '22:00', label: 'Anytime' },
  };

  const tabs = [
    { id: 'supplements', label: 'Supps' },
    { id: 'water', label: 'Water' },
    { id: 'sleep', label: 'Sleep' },
    { id: 'caffeine', label: 'Caffeine' },
    { id: 'readiness', label: 'Readiness' },
  ] as const;

  return (
    <div className="space-y-4 pb-8">
      <h1 className="text-xl font-bold text-white">Health</h1>
      <p className="text-xs text-white/30 -mt-3">For personal tracking only, not medical advice</p>

      {/* Sub-nav */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            tab === t.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40 hover:text-white/60'
          }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'supplements' && (
        <>
          <BentoCard
            title="Supplements"
            subtitle={data.supplements.length > 0 ? `${data.supplements.length} tracked` : ''}
            action={<button onClick={() => setSupModal(true)} className="text-xs text-cyan-400">+ Add</button>}
          >
            {data.supplements.length === 0 ? (
              <div key="empty">
                <p className="text-sm text-white/30 mb-3">No supplements tracked yet. Add from the common list or create custom.</p>
                <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
                  {COMMON_SUPPLEMENTS.slice(0, showAllSupps ? COMMON_SUPPLEMENTS.length : 6).map(s => (
                    <button key={s.name} onClick={() => {
                      const win = supplementSchedule[s.schedule];
                      addSupplement({
                        name: s.name, dose: s.dose, unit: s.unit, schedule: s.schedule,
                        windowStart: win.start, windowEnd: win.end, notes: '',
                        runningLow: false, stockCount: 30, isCustom: false,
                      });
                    }} className="text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 border border-white/5">
                      <div className="font-medium text-white text-sm mb-0.5">{s.name}</div>
                      <div className="text-white/40">{s.dose}{s.unit} · {s.schedule}</div>
                    </button>
                  ))}
                </div>
                {COMMON_SUPPLEMENTS.length > 6 && (
                  <button onClick={() => setShowAllSupps(!showAllSupps)} className="text-xs text-cyan-400/60 mt-2">
                    {showAllSupps ? 'Show less' : `Show all ${COMMON_SUPPLEMENTS.length}`}
                  </button>
                )}
              </div>
            ) : (
              <div key="list" className="space-y-2">
                {data.supplements.length > 0 && data.supplements.map(s => {
                  const log = data.supplementLogs.find(l => l.supplementId === s.id && l.date === d);
                  const win = supplementSchedule[s.schedule] || { start: '07:00', end: '22:00' };
                  const now = new Date();
                  const currentMin = now.getHours() * 60 + now.getMinutes();
                  const endMin = parseInt(win.end.split(':')[0]) * 60 + parseInt(win.end.split(':')[1] || '0');
                  const pastDue = currentMin > endMin && !log?.taken;
                  return (
                    <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl ${pastDue ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'} ${s.runningLow ? 'border border-amber-500/20' : ''}`}>
                      <button
                        onClick={() => toggleSupplement(s.id, d)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          log?.taken ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'
                        }`}
                      >
                        {log?.taken && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{s.name}</span>
                          {s.runningLow && <span className="text-[10px] text-amber-400">Low</span>}
                        </div>
                        <div className="text-xs text-white/40">{s.dose}{s.unit} · {win.label}</div>
                      </div>
                      <button onClick={() => setDeleteConfirm(s.id)} className="p-3 rounded-lg bg-white/5 text-red-400/50 hover:text-red-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </BentoCard>

          <Modal open={supModal} onClose={() => setSupModal(false)} title="Add Supplement">
            <div className="space-y-3">
              <div>
                <label>Supplement Name</label>
                <input value={newSup.name} onChange={e => setNewSup(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Creatine Monohydrate" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>Dose</label>
                  <input value={newSup.dose} onChange={e => setNewSup(p => ({ ...p, dose: e.target.value }))} />
                </div>
                <div>
                  <label>Unit</label>
                  <select value={newSup.unit} onChange={e => setNewSup(p => ({ ...p, unit: e.target.value }))}>
                    <option value="g">g</option><option value="mg">mg</option><option value="mcg">mcg</option>
                    <option value="IU">IU</option><option value="mL">mL</option><option value="tablet">tablet</option>
                    <option value="scoop">scoop</option><option value="capsule">capsule</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Schedule</label>
                <select value={newSup.schedule} onChange={e => {
                  const win = supplementSchedule[e.target.value];
                  setNewSup(p => ({ ...p, schedule: e.target.value as any, windowStart: win.start, windowEnd: win.end }));
                }}>
                  <option value="morning">Morning (7–10 AM)</option>
                  <option value="lunch">Lunch (11 AM–2 PM)</option>
                  <option value="evening">Evening (6–10 PM)</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newSup.runningLow} onChange={e => setNewSup(p => ({ ...p, runningLow: e.target.checked }))} className="w-4 h-4 rounded border-white/20" />
                  <span className="text-sm text-white/60">Running low</span>
                </label>
                <div className="flex-1">
                  <input type="number" value={newSup.stockCount} onChange={e => setNewSup(p => ({ ...p, stockCount: parseInt(e.target.value) || 0 }))} placeholder="Stock count" />
                </div>
              </div>
              <div>
                <label>Notes (optional)</label>
                <textarea value={newSup.notes} onChange={e => setNewSup(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <button onClick={handleAddSup} className="btn-primary w-full">Add Supplement</button>
            </div>
          </Modal>

          <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Supplement?">
            <div className="space-y-4">
              <p className="text-sm text-white/60">
                Delete "{data.supplements.find(s => s.id === deleteConfirm)?.name}" and all its logs?
              </p>
              <button onClick={() => { const id = deleteConfirm; setDeleteConfirm(null); if (id) deleteSupplement(id); }} className="btn-danger w-full">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary w-full">Cancel</button>
            </div>
          </Modal>
        </>
      )}

      {tab === 'water' && (
        <BentoCard title="Water Tracker">
          <ProgressBar value={waterTotal} max={waterTarget} color="#06b6d4" size="lg" showLabel label={`${Math.round(waterTotal)} / ${Math.round(waterTarget)} mL`} />
          <div className="flex gap-2 mt-4">
            <button onClick={() => addWater({ date: d, amount: data.profile.bottleSize || 250, unit: data.profile.waterUnit, timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) })} className="btn-primary flex-1">+ Add Bottle</button>
          </div>
          <div className="mt-4 text-xs text-white/30 leading-relaxed">
            <p>Daily target: {waterTarget} mL based on body weight ({data.profile.weight}{data.profile.weightUnit}), activity ({data.profile.activityHours}h/week), and caffeine intake.</p>
            <p className="mt-1">Formula: weight (kg) × 33 mL + 300 mL per activity hour + adjustments.</p>
          </div>
        </BentoCard>
      )}

      {tab === 'sleep' && (
        <>
          <BentoCard
            title="Sleep Tracker"
            action={<button onClick={() => setSleepModal(true)} className="text-xs text-cyan-400">+ Log</button>}
          >
            {lastSleep.length === 0 ? (
              <div className="py-6 text-center text-sm text-white/30">No sleep data logged yet</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-indigo-400">{lastSleep[0]?.duration || '—'}h</div>
                    <div className="text-xs text-white/40">Last night</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium text-white">{lastSleep[0]?.quality}/10</div>
                    <div className="text-xs text-white/40">Quality</div>
                  </div>
                </div>
                <ProgressBar value={data.profile.sleepGoal || 8} max={data.profile.sleepGoal || 8} color="#818cf8" size="sm" />
                <div className="text-xs text-white/50">Goal: {data.profile.sleepGoal || 8}h per night</div>
                {sleepDebt > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-sm font-medium text-amber-400">Sleep debt: {Math.round(sleepDebt * 10) / 10}h</div>
                    <div className="text-xs text-white/40 mt-1">Over the last 7 days</div>
                  </div>
                )}
                {lastSleep.length > 1 && (
                  <div className="space-y-1 mt-3">
                    <div className="text-xs text-white/40 mb-1">Last 7 nights</div>
                    <div className="flex gap-1 items-end h-16">
                      {lastSleep.slice(-7).map((s, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-md transition-all"
                            style={{
                              height: `${(s.duration / (data.profile.sleepGoal || 8)) * 100}%`,
                              backgroundColor: s.quality >= 7 ? '#818cf8' : s.quality >= 5 ? '#f59e0b' : '#ef4444',
                              minHeight: 4,
                              maxHeight: 64,
                            }}
                          />
                          <span className="text-[8px] text-white/30">{s.duration}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </BentoCard>

          <Modal open={sleepModal} onClose={() => setSleepModal(false)} title="Log Sleep">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>Bedtime</label>
                  <input type="time" value={newSleep.bedtime} onChange={e => setNewSleep(p => ({ ...p, bedtime: e.target.value }))} />
                </div>
                <div>
                  <label>Wake Time</label>
                  <input type="time" value={newSleep.wakeTime} onChange={e => setNewSleep(p => ({ ...p, wakeTime: e.target.value }))} />
                </div>
              </div>
              <div>
                <label>Quality (1–10)</label>
                <input type="range" min="1" max="10" value={newSleep.quality} onChange={e => setNewSleep(p => ({ ...p, quality: parseInt(e.target.value) }))} className="w-full" />
                <div className="text-center text-sm text-white/60">{newSleep.quality}/10</div>
              </div>
              <div>
                <label>Notes (optional)</label>
                <textarea value={newSleep.notes} onChange={e => setNewSleep(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newSleep.isNap} onChange={e => setNewSleep(p => ({ ...p, isNap: e.target.checked }))} />
                <span className="text-sm text-white/60">This is a nap</span>
              </label>
              <button onClick={handleAddSleep} className="btn-primary w-full">Log Sleep</button>
            </div>
          </Modal>
        </>
      )}

      {tab === 'caffeine' && (
        <>
          <BentoCard
            title="Caffeine Tracker"
            subtitle={`${totalCaf}mg today`}
            action={<button onClick={() => setCafModal(true)} className="text-xs text-cyan-400">+ Log</button>}
          >
            <div className="space-y-4">
              <ProgressBar value={totalCaf} max={400} color={totalCaf > 400 ? '#ef4444' : '#f59e0b'} size="md" showLabel label={`${totalCaf}mg / 400mg`} />
              
              {totalCaf > 400 && (
                <div className="p-2 rounded-lg bg-red-500/10 text-xs text-red-400">⚠ High caffeine intake today</div>
              )}

              <div className="space-y-2">
                {todayCaffeine.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                    <div>
                      <div className="text-sm text-white">{c.drinkName}</div>
                      <div className="text-xs text-white/40">{c.timestamp} · {c.servingSize}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-amber-400">{c.caffeineMg}mg</span>
                      <button onClick={() => deleteCaffeine(c.id)} className="text-red-400/50 hover:text-red-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
                {todayCaffeine.length === 0 && <div className="text-sm text-white/30 text-center py-4">No caffeine logged today</div>}
              </div>

              {/* Caffeine curve */}
              {caffeineCurve.length > 0 && (
                <div>
                  <div className="text-xs text-white/40 mb-2">Estimated caffeine level throughout the day</div>
                  <div className="flex items-end gap-0.5 h-20">
                    {caffeineCurve.filter((_, i) => i % 2 === 0).map((p, i) => {
                      const maxLevel = Math.max(...caffeineCurve.map(c => c.level), 1);
                      const height = Math.min(100, (p.level / maxLevel) * 100);
                      const now = new Date();
                      const pHour = parseInt(p.time.split(':')[0]);
                      const isNow = pHour === now.getHours();
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex justify-center">
                            <div
                              className={`w-full rounded-t-sm transition-all ${isNow ? 'bg-cyan-400' : 'bg-amber-500/30'}`}
                              style={{ height: `${height}%`, maxHeight: 64 }}
                            />
                          </div>
                          {i % 4 === 0 && <span className="text-[6px] text-white/20 mt-0.5">{p.time}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-white/5 text-xs text-white/40 leading-relaxed">
                <p>☕ Caffeine half-life: ~5h (normal sensitivity)</p>
                <p>🛑 Stop caffeine by: {stopCafHour.toString().padStart(2, '0')}:00 to protect sleep</p>
                <p>💤 Caffeine at bedtime: may reduce sleep quality by 30–50%</p>
              </div>
            </div>
          </BentoCard>

          <Modal open={cafModal} onClose={() => setCafModal(false)} title="Log Caffeine" wide>
            <div className="space-y-3">
              <label className="text-sm text-white/60">Common drinks</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {COMMON_DRINKS.map(d => (
                  <button key={d.name} onClick={() => handleAddCaf(d.name, d.caffeine, d.serving)}
                    className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5">
                    <div className="text-sm text-white">{d.name}</div>
                    <div className="text-xs text-white/40">{d.caffeine}mg · {d.serving}</div>
                  </button>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 mt-2">
                <label className="text-sm text-white/60">Custom drink</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div><label>Name</label><input value={newCaf.drinkName} onChange={e => setNewCaf(p => ({ ...p, drinkName: e.target.value }))} placeholder="e.g. Cold brew" /></div>
                  <div><label>Caffeine (mg)</label><input type="number" value={newCaf.caffeineMg} onChange={e => setNewCaf(p => ({ ...p, caffeineMg: parseInt(e.target.value) || 0 }))} /></div>
                </div>
                <button onClick={handleCustomCaf} className="btn-secondary w-full mt-2">Log Custom Drink</button>
              </div>
            </div>
          </Modal>
        </>
      )}

      {tab === 'readiness' && (
        <>
          <BentoCard
            title="Readiness / Peak State"
            action={<button onClick={() => setReadinessModal(true)} className="text-xs text-cyan-400">Log Now</button>}
          >
            {data.readinessLogs.length === 0 ? (
              <div className="py-6 text-center text-sm text-white/30">Log your readiness to get a score and predictions</div>
            ) : (
              <div className="space-y-3">
                {data.readinessLogs.slice(-3).reverse().map(r => {
                  const score = calculateReadinessScore(r);
                  return (
                    <div key={r.id} className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{r.date}</span>
                        <span className={`text-lg font-bold ${
                          score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
                        }`}>{score}/100</span>
                      </div>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="text-white/40">Energy: {r.energy}/10</span>
                        <span className="text-white/40">Focus: {r.focus}/10</span>
                        <span className="text-white/40">Mood: {r.mood}/10</span>
                      </div>
                      <div className="text-xs text-white/30 mt-1 capitalize">State: {r.state}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {lastSleep.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-white/5">
                <div className="text-sm font-medium text-white mb-2">Today's Peak Focus Window</div>
                {totalCaf > 0 ? (
                  <div className="text-xs text-cyan-400">☕ Estimated peak: 1–4 hours after caffeine</div>
                ) : (
                  <div className="text-xs text-white/40">Log caffeine to estimate peak focus window</div>
                )}
                <div className="text-xs text-white/30 mt-1">
                  {lastSleep[0] && lastSleep[0].quality < 6 ? '⚡ Low energy expected — prioritize lighter tasks' : '✅ Good recovery — deep work recommended'}
                </div>
              </div>
            )}
          </BentoCard>

          <Modal open={readinessModal} onClose={() => setReadinessModal(false)} title="Log Readiness">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label>Energy (1–10)</label><input type="range" min="1" max="10" value={newReadiness.energy} onChange={e => setNewReadiness(p => ({ ...p, energy: parseInt(e.target.value) }))} className="w-full" /><span className="text-xs text-white/40">{newReadiness.energy}/10</span></div>
                <div><label>Focus (1–10)</label><input type="range" min="1" max="10" value={newReadiness.focus} onChange={e => setNewReadiness(p => ({ ...p, focus: parseInt(e.target.value) }))} className="w-full" /><span className="text-xs text-white/40">{newReadiness.focus}/10</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label>Mood (1–10)</label><input type="range" min="1" max="10" value={newReadiness.mood} onChange={e => setNewReadiness(p => ({ ...p, mood: parseInt(e.target.value) }))} className="w-full" /><span className="text-xs text-white/40">{newReadiness.mood}/10</span></div>
                <div><label>Stress (1–10)</label><input type="range" min="1" max="10" value={newReadiness.stress} onChange={e => setNewReadiness(p => ({ ...p, stress: parseInt(e.target.value) }))} className="w-full" /><span className="text-xs text-white/40">{newReadiness.stress}/10</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label>Soreness (1–10)</label><input type="range" min="1" max="10" value={newReadiness.soreness} onChange={e => setNewReadiness(p => ({ ...p, soreness: parseInt(e.target.value) }))} className="w-full" /><span className="text-xs text-white/40">{newReadiness.soreness}/10</span></div>
                <div>
                  <label>State</label>
                  <select value={newReadiness.state} onChange={e => setNewReadiness(p => ({ ...p, state: e.target.value as any }))}>
                    <option value="foggy">Foggy</option><option value="sharp">Sharp</option><option value="tired">Tired</option><option value="focused">Focused</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Notes (optional)</label>
                <textarea value={newReadiness.notes} onChange={e => setNewReadiness(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <button onClick={handleAddReadiness} className="btn-primary w-full">Log Readiness</button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
