'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import BentoCard from '@/components/BentoCard';
import Modal from '@/components/Modal';
import ProgressBar from '@/components/ProgressBar';
import { useStore } from '@/lib/store';
import {
  today, formatDate, calculateWaterTarget, calculateNetWorth,
  calculateSleepDebt, calculateCaffeineCurve, generateTickerAlerts,
  formatCurrency, daysUntil, isOverdue, getCategoryColor, getPriorityColor,
  calculateMacroProgress, generateCoachAdvice
} from '@/lib/utils';
import { Goal, Task } from '@/lib/types';

export default function MainPage() {
  return (
    <AppShell>
      <MainDashboard />
    </AppShell>
  );
}

function MainDashboard() {
  const { data, addWater, addTask, addGoal, toggleGoal, toggleTask, deleteTask, updateTask, pushTasks } = useStore();
  const router = useRouter();
  const d = today();
  const [goalModal, setGoalModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [waterModal, setWaterModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const waterLogs = data.waterLogs.filter(l => l.date === d);
  const waterTotal = waterLogs.reduce((s, l) => s + l.amount, 0);
  const waterTarget = calculateWaterTarget(data.profile);
  const bottleSize = data.profile.bottleSize || 250;
  const bottlesTotal = Math.round(waterTarget / bottleSize);
  const bottlesNow = Math.round(waterTotal / bottleSize);
  const netWorth = calculateNetWorth(data);
  const todayTasks = data.tasks.filter(t => t.date === d);
  const incompleteTasks = todayTasks.filter(t => !t.completed);
  const completedTasks = todayTasks.filter(t => t.completed);
  const todayGoals = data.goals.filter(g => g.dueDate === d);
  const sleepDebt = calculateSleepDebt(data.sleepLogs, data.profile.sleepGoal || 8);
  const todayCaffeine = data.caffeineLogs.filter(l => l.date === d);
  const totalCaf = todayCaffeine.reduce((s, l) => s + l.caffeineMg, 0);
  const lastSleep = data.sleepLogs.filter(l => !l.isNap).slice(-1)[0];
  const todayWorkout = data.workoutSessions.find(s => s.date === d);
  const goalCompletion = todayGoals.length > 0 ? Math.round((todayGoals.filter(g => g.completed).length / todayGoals.length) * 100) : 0;
  const tickerAlerts = generateTickerAlerts(data, d);

  const todayFood = data.foodLogs.filter(f => f.date === d);
  const macroProgress = calculateMacroProgress(todayFood, data.profile.macroGoals);
  const coachAdvice = generateCoachAdvice(data, d);

  const [newGoal, setNewGoal] = useState({ title: '', dueDate: d, priority: 'medium' as Goal['priority'], category: 'personal' as Goal['category'], description: '' });
  const [newTask, setNewTask] = useState({ title: '', date: d, priority: 'medium' as Task['priority'], category: 'personal' as Task['category'], timeBlock: '' });

  const addWaterBottle = () => {
    addWater({ date: d, amount: bottleSize, unit: data.profile.waterUnit, timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) });
  };
  const subWaterBottle = () => {
    if (waterTotal >= bottleSize) {
      addWater({ date: d, amount: -bottleSize, unit: data.profile.waterUnit, timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) });
    }
  };

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) return;
    addGoal({ title: newGoal.title, description: newGoal.description, dueDate: newGoal.dueDate, priority: newGoal.priority, category: newGoal.category, completed: false });
    setNewGoal({ title: '', dueDate: d, priority: 'medium', category: 'personal', description: '' });
    setGoalModal(false);
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    addTask({ title: newTask.title, date: newTask.date, priority: newTask.priority, category: newTask.category, completed: false, timeBlock: newTask.timeBlock });
    setNewTask({ title: '', date: d, priority: 'medium', category: 'personal', timeBlock: '' });
    setTaskModal(false);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{data.profile.dashboardTitle}</h1>
          <p className="text-xs text-white/30 mt-0.5 font-mono">{formatDate(d)}</p>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="w-9 h-9 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-all"
        >
          <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      </div>

      {/* ·01 Main - Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <BentoCard number="·01" compact glow="green" onClick={() => router.push('/health')}>
          <div className="text-[10px] text-white/30 tracking-wider uppercase mb-1">Sleep</div>
          <div className="text-xl font-bold text-[#63f0ad]">{lastSleep ? `${lastSleep.duration}h` : '—'}</div>
          <div className="text-[10px] text-white/30">{lastSleep ? `Quality ${lastSleep.quality}/10` : 'No data'}</div>
          {sleepDebt > 0 && <div className="text-[9px] text-amber-400/70 mt-1">{Math.round(sleepDebt * 10) / 10}h debt</div>}
        </BentoCard>
        <BentoCard number="·02" compact glow="cyan" onClick={() => router.push('/health')}>
          <div className="text-[10px] text-white/30 tracking-wider uppercase mb-1">Caffeine</div>
          <div className="text-xl font-bold text-[#2dd4bf]">{totalCaf}mg</div>
          <div className="text-[10px] text-white/30">{todayCaffeine.length} drinks</div>
          {totalCaf > 400 && <div className="text-[9px] text-red-400/70 mt-1">Over limit</div>}
        </BentoCard>
        <BentoCard number="·03" compact glow="purple" onClick={() => router.push('/finance')}>
          <div className="text-[10px] text-white/30 tracking-wider uppercase mb-1">Net Worth</div>
          <div className="text-xl font-bold text-[#a78bfa]">{formatCurrency(netWorth, data.profile.currencySymbol)}</div>
          <div className="text-[10px] text-white/30">Today</div>
        </BentoCard>
      </div>

      {/* ·04 Fitness - wide */}
      <BentoCard number="·04" sectionLabel="Today's Tasks" glow="green" onClick={() => router.push('/gym')}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-white/30 tracking-wider uppercase mb-2">Gym</div>
            {todayWorkout?.completed ? (
              <div className="text-sm text-[#63f0ad]">Workout done</div>
            ) : todayWorkout ? (
              <div className="text-sm text-amber-400">Started — not complete</div>
            ) : (
              <div className="text-sm text-white/30">No workout today</div>
            )}
            {data.workoutSessions.filter(s => s.completed).slice(-1).map(s => (
              <div key={s.id} className="text-[10px] text-white/20 mt-1">Last: {s.splitName}</div>
            ))}
          </div>
          <div>
            <div className="text-[10px] text-white/30 tracking-wider uppercase mb-2">Water</div>
            <ProgressBar value={waterTotal} max={waterTarget} color="#2dd4bf" size="sm" />
            <div className="text-xs text-white/40 mt-1">{bottlesNow}/{bottlesTotal} bottles</div>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={(e) => { e.stopPropagation(); addWaterBottle(); }} className="btn-ghost flex-1 text-xs">+ Water</button>
          <button onClick={(e) => { e.stopPropagation(); setTaskModal(true); }} className="btn-ghost flex-1 text-xs">+ Task</button>
        </div>
      </BentoCard>

      {/* ·05 Health - small, ·06 Water - small */}
      <div className="grid grid-cols-2 gap-3">
        <BentoCard number="·05" compact glow="pink" onClick={() => router.push('/health')}>
          <div className="section-label mb-2">Health</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">Supps</span>
              <span className="text-white/70">{data.supplements.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">Readiness</span>
              <span className="text-white/70">{data.readinessLogs.length > 0 ? `${data.readinessLogs.slice(-1)[0].energy}/10` : '—'}</span>
            </div>
          </div>
        </BentoCard>
        <BentoCard number="·06" compact glow="cyan">
          <div className="section-label mb-2">Water</div>
          <div className="text-2xl font-bold text-[#2dd4bf]">{bottlesNow}/{bottlesTotal}</div>
          <div className="text-[10px] text-white/30">bottles today</div>
          <ProgressBar value={waterTotal} max={waterTarget} color="#2dd4bf" size="sm" />
        </BentoCard>
      </div>

      {/* ·07 Finance - wide */}
      <BentoCard number="·07" sectionLabel="Finance" glow="purple" onClick={() => router.push('/finance')}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-white/30 tracking-wider uppercase mb-1">Net Worth</div>
            <div className="text-lg font-bold text-[#a78bfa]">{formatCurrency(netWorth, data.profile.currencySymbol)}</div>
            <div className="text-[10px] text-white/30 mt-1">1% = {formatCurrency(netWorth / 100, data.profile.currencySymbol)}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/30 tracking-wider uppercase mb-1">Subscriptions</div>
            <div className="text-lg font-bold text-white">{formatCurrency(
              data.subscriptions.filter(s => !s.cancelled).reduce((s, sub) => s + sub.amount, 0),
              data.profile.currencySymbol
            )}/mo</div>
          </div>
        </div>
      </BentoCard>

      {/* ·08 Caffeine - small, ·09 Goals - small */}
      <div className="grid grid-cols-2 gap-3">
        <BentoCard number="·08" compact glow="amber">
          <div className="section-label mb-2">Caffeine</div>
          <div className="text-lg font-bold text-[#f59e0b]">{totalCaf}mg</div>
          <div className="text-[10px] text-white/30 mb-2">of 400mg limit</div>
          <ProgressBar value={totalCaf} max={400} color={totalCaf > 400 ? '#ef4444' : '#f59e0b'} size="sm" />
        </BentoCard>
        <BentoCard number="·09" compact glow="green" action={<button onClick={() => setGoalModal(true)} className="text-[10px] text-[#63f0ad]">+</button>}>
          <div className="section-label mb-2">Goals</div>
          <div className="text-lg font-bold text-[#63f0ad]">{goalCompletion}%</div>
          <div className="text-[10px] text-white/30">{todayGoals.filter(g => g.completed).length}/{todayGoals.length} done</div>
        </BentoCard>
      </div>

      {/* ·10 Food / Macros - wide */}
      <BentoCard number="·10" sectionLabel="Today's Fuel" glow="green" onClick={() => router.push('/food')}>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider">Kcal</div>
            <div className="text-sm font-bold text-white">{Math.round(macroProgress.calories)}</div>
            <div className="macro-bar-bg mt-1"><div className="macro-bar-fill" style={{ width: `${macroProgress.caloriesPct}%`, background: '#63f0ad' }} /></div>
            <div className="text-[8px] text-white/20">{Math.round(macroProgress.calories)}/{data.profile.macroGoals.calories}</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider">Protein</div>
            <div className="text-sm font-bold text-[#63f0ad]">{Math.round(macroProgress.protein)}g</div>
            <div className="macro-bar-bg mt-1"><div className="macro-bar-fill" style={{ width: `${macroProgress.proteinPct}%`, background: '#63f0ad' }} /></div>
            <div className="text-[8px] text-white/20">{Math.round(macroProgress.protein)}/{data.profile.macroGoals.protein}g</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider">Carbs</div>
            <div className="text-sm font-bold text-[#2dd4bf]">{Math.round(macroProgress.carbs)}g</div>
            <div className="macro-bar-bg mt-1"><div className="macro-bar-fill" style={{ width: `${macroProgress.carbsPct}%`, background: '#2dd4bf' }} /></div>
            <div className="text-[8px] text-white/20">{Math.round(macroProgress.carbs)}/{data.profile.macroGoals.carbs}g</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider">Fat</div>
            <div className="text-sm font-bold text-[#f59e0b]">{Math.round(macroProgress.fat)}g</div>
            <div className="macro-bar-bg mt-1"><div className="macro-bar-fill" style={{ width: `${macroProgress.fatPct}%`, background: '#f59e0b' }} /></div>
            <div className="text-[8px] text-white/20">{Math.round(macroProgress.fat)}/{data.profile.macroGoals.fat}g</div>
          </div>
        </div>
        {todayFood.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {todayFood.slice(-3).map(f => (
              <div key={f.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/[0.03]">
                <span className="text-white/70">{f.name}</span>
                <span className="text-white/40 font-mono">{Math.round(f.calories)} kcal</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); router.push('/food'); }} className="btn-green w-full text-xs mt-1">Log Food</button>
      </BentoCard>

      {/* ·11 Your Coach - wide */}
      <BentoCard number="·11" sectionLabel="Your Coach" glow="green">
        <div className="flex gap-4 items-start">
          <div className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(99,240,173,0.3), transparent)' }}>
            <div className="w-8 h-8 rounded-full bg-[#63f0ad]/20 animate-float" style={{ boxShadow: '0 0 20px rgba(99,240,173,0.2)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold text-white/70">Today's Fuel</span>
              <span className="text-lg font-bold text-[#63f0ad]">{coachAdvice.score}/10</span>
            </div>
            <div className="nova-pill">Today's Read</div>
            <p className="text-xs text-white/60 leading-relaxed">{coachAdvice.readout}{coachAdvice.tip}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="btn-ghost-green text-xs">Rescore</button>
          <button onClick={() => router.push('/mentor')} className="btn-ghost-green text-xs">Ask Your Coach</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {['enough protein?', 'what to eat tonight?', 'how am I tracking?'].map(s => (
            <button key={s} onClick={() => router.push(`/mentor?q=${encodeURIComponent(s)}`)} className="text-[9px] px-2.5 py-1.5 rounded-full bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60 transition-all">
              {s}
            </button>
          ))}
        </div>
      </BentoCard>

      {/* ·12 Nova - wide */}
      <BentoCard number="·12" sectionLabel="Nova" glow="green" onClick={() => router.push('/mentor')}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center animate-breathe" style={{ background: 'radial-gradient(circle, rgba(99,240,173,0.25), transparent)' }}>
            <div className="w-6 h-6 rounded-full bg-[#63f0ad]/30" style={{ boxShadow: '0 0 15px rgba(99,240,173,0.3)' }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Nova Lite</div>
            <div className="text-[10px] text-white/30">Your mentor · Tap to chat</div>
          </div>
          <svg className="w-5 h-5 text-[#63f0ad]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      </BentoCard>

      {/* ·13 Tasks */}
      <BentoCard
        number="·13"
        sectionLabel="Tasks"
        action={<button onClick={() => setTaskModal(true)} className="text-[10px] text-[#63f0ad]">+ Add</button>}
        glow="cyan"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="text-lg font-bold text-[#2dd4bf]">{completedTasks.length}/{todayTasks.length}</div>
          <div className="text-[10px] text-white/30">done today</div>
        </div>
        {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
          <button onClick={() => setTaskModal(true)} className="w-full py-6 text-xs text-white/20 border border-dashed border-white/10 rounded-xl hover:border-white/20">
            + Add a task
          </button>
        ) : (
          <div className="space-y-1">
            {incompleteTasks.map(t => (
              <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} onEdit={(task) => { setTaskToEdit(task); setNewTask({ title: task.title, date: task.date, priority: task.priority, category: task.category, timeBlock: task.timeBlock || '' }); setTaskModal(true); }} />
            ))}
            {completedTasks.map(t => (
              <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
            ))}
          </div>
        )}
        {incompleteTasks.length > 0 && (
          <button onClick={() => pushTasks(d)} className="mt-2 text-[10px] text-amber-400/50 hover:text-amber-400">
            Push remaining to tomorrow →
          </button>
        )}
      </BentoCard>

      {/* Task Modal */}
      <Modal open={taskModal} onClose={() => { setTaskModal(false); setTaskToEdit(null); }} title={taskToEdit ? 'Edit Task' : 'Add Task'}>
        <div className="space-y-3">
          <div>
            <label>Task</label>
            <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="What do you need to do?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Priority</label>
              <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as any }))}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div>
              <label>Category</label>
              <select value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value as any }))}>
                <option value="school">School</option><option value="gym">Gym</option><option value="health">Health</option>
                <option value="finance">Finance</option><option value="personal">Personal</option><option value="work">Work</option><option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label>Time Block (optional)</label>
            <input type="time" value={newTask.timeBlock} onChange={e => setNewTask(p => ({ ...p, timeBlock: e.target.value }))} />
          </div>
          <button onClick={handleAddTask} className="btn-primary w-full">{taskToEdit ? 'Save' : 'Add Task'}</button>
        </div>
      </Modal>

      {/* Goal Modal */}
      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Add Goal">
        <div className="space-y-3">
          <div>
            <label>Goal</label>
            <input value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))} placeholder="What's your goal?" />
          </div>
          <div>
            <label>Description (optional)</label>
            <textarea value={newGoal.description} onChange={e => setNewGoal(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Due Date</label>
              <input type="date" value={newGoal.dueDate} onChange={e => setNewGoal(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div>
              <label>Priority</label>
              <select value={newGoal.priority} onChange={e => setNewGoal(p => ({ ...p, priority: e.target.value as any }))}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label>Category</label>
            <select value={newGoal.category} onChange={e => setNewGoal(p => ({ ...p, category: e.target.value as any }))}>
              <option value="school">School</option><option value="gym">Gym</option><option value="health">Health</option>
              <option value="finance">Finance</option><option value="personal">Personal</option><option value="work">Work</option><option value="other">Other</option>
            </select>
          </div>
          <button onClick={handleAddGoal} className="btn-primary w-full">Add Goal</button>
        </div>
      </Modal>

      {/* Water Log Modal */}
      <Modal open={waterModal} onClose={() => setWaterModal(false)} title="Water Log">
        <div className="space-y-4">
          <ProgressBar value={waterTotal} max={waterTarget} color="#2dd4bf" size="lg" showLabel label={`${Math.round(waterTotal)} / ${Math.round(waterTarget)} mL`} />
          <div className="text-xs text-white/20 text-center">Target based on weight, activity, and environment</div>
          <div className="flex gap-2">
            <button onClick={() => { addWaterBottle(); }} className="btn-green flex-1 text-xs">+250 mL</button>
            <button onClick={() => { addWaterBottle(); addWaterBottle(); }} className="btn-green flex-1 text-xs">+500 mL</button>
          </div>
          <div className="text-xs text-white/30 text-center">Water goal: {waterTarget} mL ({bottlesTotal} bottles)</div>
        </div>
      </Modal>
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete, onEdit }: { task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void; onEdit?: (t: Task) => void }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] group ${task.completed ? 'opacity-40' : ''}`}>
      <button
        onClick={() => onToggle(task.id)}
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          task.completed ? 'border-[#63f0ad] bg-[#63f0ad]' : 'border-white/20'
        }`}
      >
        {task.completed && <svg className="w-2.5 h-2.5 text-[#050607]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`text-xs ${task.completed ? 'line-through text-white/30' : 'text-white'}`}>{task.title}</span>
        <div className="flex gap-2 mt-0.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: getCategoryColor(task.category) + '15', color: getCategoryColor(task.category) }}>{task.category}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: getPriorityColor(task.priority) + '15', color: getPriorityColor(task.priority) }}>{task.priority}</span>
          {task.timeBlock && <span className="text-[9px] text-white/20">{task.timeBlock}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && <button onClick={() => onEdit(task)} className="p-1 rounded-lg bg-white/10 text-white/40 hover:text-white"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>}
        <button onClick={() => onDelete(task.id)} className="p-1 rounded-lg bg-white/10 text-red-400/50 hover:text-red-400"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
      </div>
    </div>
  );
}
