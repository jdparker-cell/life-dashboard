'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import BentoCard from '@/components/BentoCard';
import Modal from '@/components/Modal';
import { useStore } from '@/lib/store';
import { today, calculateProgressiveOverloadSuggestion, estimateBodyCompositionTrend, movingAverage, formatDate } from '@/lib/utils';
import { Exercise, WorkoutSession } from '@/lib/types';

export default function GymPage() {
  return (
    <AppShell>
      <GymDashboard />
    </AppShell>
  );
}

function GymDashboard() {
  const { data, addGymLocation, deleteGymLocation, addWorkoutSplit, deleteWorkoutSplit, addExercise, updateExercise, deleteExercise, startWorkout, completeWorkout, addSet, deleteSet, addWeight, deleteWeight } = useStore();
  const d = today();
  const [tab, setTab] = useState<'workout' | 'weight' | 'exercises' | 'history'>('workout');
  const [newExerciseModal, setNewExerciseModal] = useState(false);
  const [newWeightModal, setNewWeightModal] = useState(false);
  const [newSetModal, setNewSetModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [newWeight, setNewWeight] = useState({ weight: data.profile.weight || 75, unit: data.profile.weightUnit, notes: '' });
  const [newExercise, setNewExercise] = useState({ name: '', startingWeight: 20, weightUnit: 'kg' as const, repRangeMin: 6, repRangeMax: 8, increment: 2, locationId: '', notes: '' });
  const [newSet, setNewSet] = useState({ weight: 0, reps: 0, rpe: 7, notes: '' });

  const todaySession = data.workoutSessions.find(s => s.date === d && !s.completed);
  const completedToday = data.workoutSessions.find(s => s.date === d && s.completed);
  const sessionSets = todaySession ? data.workoutSets.filter(s => s.sessionId === todaySession.id) : [];
  const weightLogs = data.weightLogs.slice(-14);
  const avgWeight = weightLogs.length > 0 ? weightLogs.reduce((s, w) => s + w.weight, 0) / weightLogs.length : 0;
  const weeklyChange = weightLogs.length >= 2 ? weightLogs[weightLogs.length - 1].weight - weightLogs[0].weight : 0;
  const lastWorkout = data.workoutSessions.filter(s => s.completed).slice(-1)[0];
  const lastWorkoutSets = lastWorkout ? data.workoutSets.filter(s => s.sessionId === lastWorkout.id) : [];

  const todaySplit = data.workoutSplits.find(s => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[new Date().getDay()];
    return s.day.toLowerCase() === todayName.substring(0, 3);
  });

  const handleStartWorkout = () => {
    if (!todaySplit) return;
    startWorkout({
      date: d, splitDay: todaySplit.day, splitName: todaySplit.name,
      locationId: data.gymLocations[0]?.id, completed: false,
    });
  };

  const handleAddSet = () => {
    if (!todaySession || !selectedExercise) return;
    addSet({
      exerciseId: selectedExercise.id, sessionId: todaySession.id,
      weight: newSet.weight, reps: newSet.reps, rpe: newSet.rpe, notes: newSet.notes,
    });
    setNewSet({ weight: 0, reps: 0, rpe: 7, notes: '' });
    setNewSetModal(false);
  };

  const handleAddWeight = () => {
    addWeight({ date: d, weight: newWeight.weight, unit: newWeight.unit as any, notes: newWeight.notes });
    setNewWeight({ weight: data.profile.weight || 75, unit: data.profile.weightUnit, notes: '' });
    setNewWeightModal(false);
  };

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) return;
    addExercise({
      name: newExercise.name, startingWeight: newExercise.startingWeight,
      weightUnit: newExercise.weightUnit as any, repRangeMin: newExercise.repRangeMin,
      repRangeMax: newExercise.repRangeMax, increment: newExercise.increment,
      locationId: newExercise.locationId || undefined, notes: newExercise.notes,
    });
    setNewExercise({ name: '', startingWeight: 20, weightUnit: 'kg', repRangeMin: 6, repRangeMax: 8, increment: 2, locationId: '', notes: '' });
    setNewExerciseModal(false);
  };

  const tabs = [
    { id: 'workout', label: 'Workout' },
    { id: 'exercises', label: 'Exercises' },
    { id: 'weight', label: 'Weight' },
    { id: 'history', label: 'History' },
  ] as const;

  return (
    <div className="space-y-4 pb-8">
      <h1 className="text-xl font-bold text-white">Gym</h1>
      <p className="text-xs text-white/30 -mt-3">Estimates are based on logged trends and may be inaccurate</p>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            tab === t.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40 hover:text-white/60'
          }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'workout' && (
        <>
          <BentoCard title="Today's Workout">
            {completedToday ? (
              <div className="p-4 text-center">
                <div className="text-2xl mb-1">✅</div>
                <div className="text-emerald-400 font-medium">Workout Complete</div>
                <div className="text-xs text-white/40 mt-1">{completedToday.splitName}</div>
              </div>
            ) : todaySession ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-white">{todaySession.splitName}</div>
                    <div className="text-xs text-white/40">{data.gymLocations.find(l => l.id === todaySession.locationId)?.name || 'No location'}</div>
                  </div>
                  <button onClick={() => completeWorkout(todaySession.id)} className="btn-primary text-xs py-1.5 px-3">Done</button>
                </div>

                <div className="space-y-2 mb-3">
                  {sessionSets.length === 0 && <div className="text-xs text-white/30 py-4 text-center">No sets logged yet. Select an exercise to begin.</div>}
                  {Array.from(new Set(sessionSets.map(s => s.exerciseId))).map(exId => {
                    const ex = data.exercises.find(e => e.id === exId);
                    const exSets = sessionSets.filter(s => s.exerciseId === exId);
                    if (!ex) return null;
                    const suggestion = calculateProgressiveOverloadSuggestion(ex, exSets);
                    return (
                      <div key={exId} className="p-3 rounded-xl bg-white/5">
                        <div className="text-sm font-medium text-white mb-2">{ex.name}</div>
                        {exSets.map(s => (
                          <div key={s.id} className="flex items-center justify-between text-xs text-white/50 py-1 border-b border-white/5 last:border-0">
                            <span>{s.reps} reps × {s.weight}{ex.weightUnit}</span>
                            <div className="flex items-center gap-2">
                              {s.rpe && <span className="text-white/30">RPE {s.rpe}</span>}
                              <button onClick={() => deleteSet(s.id)} className="text-red-400/50 hover:text-red-400"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                            </div>
                          </div>
                        ))}
                        <div className="text-[10px] text-cyan-400/60 mt-1">{suggestion.message}</div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-2 block">Add set to exercise</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedExercise?.id || ''}
                      onChange={e => {
                        const ex = data.exercises.find(x => x.id === e.target.value);
                        setSelectedExercise(ex || null);
                        if (ex) setNewSet(p => ({ ...p, weight: ex.startingWeight }));
                      }}
                      className="flex-1 text-sm"
                    >
                      <option value="">Select exercise</option>
                      {data.exercises.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                    <button onClick={() => { if (selectedExercise) setNewSetModal(true); }} className="btn-primary text-xs">+ Set</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                {todaySplit && todaySplit.day !== 'rest' ? (
                  <>
                    <div className="text-sm text-white/40 mb-3">Today: {todaySplit.name}</div>
                    <button onClick={handleStartWorkout} className="btn-primary">Start Workout</button>
                  </>
                ) : (
                  <div className="text-sm text-white/30">Rest day — no workout scheduled</div>
                )}
              </div>
            )}
          </BentoCard>

          <Modal open={newSetModal} onClose={() => setNewSetModal(false)} title={`Log Set - ${selectedExercise?.name || ''}`}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>Weight ({selectedExercise?.weightUnit || 'kg'})</label>
                  <input type="number" value={newSet.weight} onChange={e => setNewSet(p => ({ ...p, weight: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label>Reps</label>
                  <input type="number" value={newSet.reps} onChange={e => setNewSet(p => ({ ...p, reps: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div>
                <label>RPE (optional)</label>
                <input type="range" min="1" max="10" value={newSet.rpe} onChange={e => setNewSet(p => ({ ...p, rpe: parseInt(e.target.value) }))} className="w-full" />
                <span className="text-xs text-white/50">{newSet.rpe}/10</span>
              </div>
              <div>
                <label>Notes (optional)</label>
                <textarea value={newSet.notes} onChange={e => setNewSet(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <button onClick={handleAddSet} className="btn-primary w-full">Log Set</button>
            </div>
          </Modal>
        </>
      )}

      {tab === 'exercises' && (
        <BentoCard
          title="Exercise Database"
          subtitle={`${data.exercises.length} exercises`}
          action={<button onClick={() => setNewExerciseModal(true)} className="text-xs text-cyan-400">+ Add</button>}
        >
          {data.exercises.length === 0 ? (
            <div className="py-6 text-center text-sm text-white/30">No exercises yet. Add your first exercise.</div>
          ) : (
            <div className="space-y-2">
              {data.exercises.map(e => {
                const allSets = data.workoutSets.filter(s => s.exerciseId === e.id).slice(-5);
                const suggestion = calculateProgressiveOverloadSuggestion(e, allSets);
                return (
                  <div key={e.id} className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{e.name}</div>
                        <div className="text-xs text-white/40">{e.startingWeight}{e.weightUnit} · {e.repRangeMin}–{e.repRangeMax} reps · +{e.increment}{e.weightUnit}</div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => deleteExercise(e.id)} className="p-1.5 rounded-lg bg-white/5 text-red-400/50 hover:text-red-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-cyan-400/60 mt-1">{suggestion.message}</div>
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>
      )}

      {tab === 'weight' && (
        <>
          <BentoCard
            title="Weight Tracker"
            action={<button onClick={() => setNewWeightModal(true)} className="text-xs text-cyan-400">+ Log</button>}
          >
            {weightLogs.length === 0 ? (
              <div className="py-6 text-center text-sm text-white/30">No weight data logged yet</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white">{weightLogs[weightLogs.length - 1]?.weight}<span className="text-sm text-white/40">{data.profile.weightUnit}</span></div>
                    <div className="text-xs text-white/40">Latest weigh-in</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${weeklyChange > 0 ? 'text-amber-400' : weeklyChange < 0 ? 'text-emerald-400' : 'text-white/40'}`}>
                      {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(1)}
                    </div>
                    <div className="text-xs text-white/40">7-day change</div>
                  </div>
                </div>

                {/* Weight chart */}
                <div className="h-28 flex items-end gap-1">
                  {weightLogs.slice(-14).map((w, i) => {
                    const maxW = Math.max(...weightLogs.map(x => x.weight));
                    const minW = Math.min(...weightLogs.map(x => x.weight));
                    const range = maxW - minW || 1;
                    const height = ((w.weight - minW) / range) * 100;
                    const isLatest = i === weightLogs.slice(-14).length - 1;
                    return (
                      <div key={w.id} className="flex-1 flex flex-col items-center justify-end">
                        <div
                          className={`w-full rounded-t-sm ${isLatest ? 'bg-cyan-400' : 'bg-emerald-500/40'}`}
                          style={{ height: `${Math.max(4, height)}%`, maxHeight: 80 }}
                        />
                        <span className="text-[7px] text-white/20 mt-0.5">
                          {new Date(w.date + 'T00:00:00').getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {weightLogs.length >= 2 && (
                  <div className="text-xs text-white/30">
                    7-day avg: {avgWeight.toFixed(1)}{data.profile.weightUnit}
                  </div>
                )}
              </div>
            )}
          </BentoCard>

          {/* Body Composition Estimate */}
          {weightLogs.length >= 2 && (
            <BentoCard title="Estimated Composition Trend">
              {(() => {
                const exerciseProgress = data.exercises.map(e => {
                  const sets = data.workoutSets.filter(s => s.exerciseId === e.id);
                  return sets.map(s => ({ weight: s.weight, reps: s.reps }));
                });
                const est = estimateBodyCompositionTrend(weightLogs, exerciseProgress);
                const colors: Record<string, string> = {
                  'muscle-gain': 'text-emerald-400', 'fat-gain': 'text-amber-400',
                  'fat-loss': 'text-green-400', 'maintenance': 'text-blue-400', 'uncertain': 'text-white/40'
                };
                return (
                  <div>
                    <div className={`text-sm font-medium ${colors[est.trend]}`}>{est.trend.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                    <div className="text-xs text-white/40 mt-1">{est.description}</div>
                    <div className="text-[10px] text-white/20 mt-2">This is an estimate based on logged data, not medical advice.</div>
                  </div>
                );
              })()}
            </BentoCard>
          )}

          <Modal open={newWeightModal} onClose={() => setNewWeightModal(false)} title="Log Weight">
            <div className="space-y-3">
              <div>
                <label>Weight ({data.profile.weightUnit})</label>
                <input type="number" value={newWeight.weight} onChange={e => setNewWeight(p => ({ ...p, weight: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={newWeight.unit === 'kg'} onChange={() => setNewWeight(p => ({ ...p, unit: 'kg' }))} />
                  <span className="text-sm text-white/60">kg</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={newWeight.unit === 'lb'} onChange={() => setNewWeight(p => ({ ...p, unit: 'lb' }))} />
                  <span className="text-sm text-white/60">lb</span>
                </label>
              </div>
              <div>
                <label>Notes (optional)</label>
                <textarea value={newWeight.notes} onChange={e => setNewWeight(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <button onClick={handleAddWeight} className="btn-primary w-full">Log Weight</button>
            </div>
          </Modal>
        </>
      )}

      {tab === 'history' && (
        <BentoCard title="Past Workouts">
          {data.workoutSessions.filter(s => s.completed).length === 0 ? (
            <div className="py-6 text-center text-sm text-white/30">No completed workouts yet</div>
          ) : (
            <div className="space-y-2">
              {data.workoutSessions.filter(s => s.completed).slice(-10).reverse().map(s => {
                const sets = data.workoutSets.filter(ws => ws.sessionId === s.id);
                return (
                  <div key={s.id} className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white">{s.splitName}</div>
                        <div className="text-xs text-white/40">{s.date} · {sets.length} sets</div>
                      </div>
                      <span className="text-xs text-emerald-400">Done</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>
      )}

      <Modal open={newExerciseModal} onClose={() => setNewExerciseModal(false)} title="Add Exercise">
        <div className="space-y-3">
          <div>
            <label>Exercise Name</label>
            <input value={newExercise.name} onChange={e => setNewExercise(p => ({ ...p, name: e.target.value }))} placeholder="e.g. DB Press" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Starting Weight</label>
              <input type="number" value={newExercise.startingWeight} onChange={e => setNewExercise(p => ({ ...p, startingWeight: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label>Unit</label>
              <select value={newExercise.weightUnit} onChange={e => setNewExercise(p => ({ ...p, weightUnit: e.target.value as any }))}>
                <option value="kg">kg</option><option value="lb">lb</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Min Reps</label>
              <input type="number" value={newExercise.repRangeMin} onChange={e => setNewExercise(p => ({ ...p, repRangeMin: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label>Max Reps</label>
              <input type="number" value={newExercise.repRangeMax} onChange={e => setNewExercise(p => ({ ...p, repRangeMax: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label>Increment Amount</label>
            <input type="number" value={newExercise.increment} onChange={e => setNewExercise(p => ({ ...p, increment: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div>
            <label>Notes (optional)</label>
            <textarea value={newExercise.notes} onChange={e => setNewExercise(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <button onClick={handleAddExercise} className="btn-primary w-full">Add Exercise</button>
        </div>
      </Modal>
    </div>
  );
}
