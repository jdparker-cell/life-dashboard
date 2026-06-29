'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppData, Supplement, WaterLog, SleepLog, CaffeineLog, Goal, Task, WorkoutSession, WorkoutSet, Exercise, WeightLog, ProgressPhoto, FinanceAccount, InvestmentHolding, CryptoHolding, OtherAsset, Subscription, Order, Receipt, WishlistItem, IncomeLog, NetWorthSnapshot, GymLocation, WorkoutSplit, SupplementLog, ReadinessLog, FoodEntry, MacroGoals } from './types';
import { generateId, today } from './utils';
import { createDemoData } from './demoData';
import { hasSupabase, getSyncPassphrase, setSyncPassphrase as setPassphrase, clearSyncPassphrase, getUserId, loadFromCloud, saveToCloud } from './supabase';

const STORAGE_KEY = 'life-dashboard-data';
const DEFAULT_MACRO_GOALS: MacroGoals = {
  calories: 2500, protein: 180, carbs: 250, fat: 70,
};

const DEFAULT_PROFILE = {
  name: 'Jack', age: 25, height: 175, weight: 75, weightUnit: 'kg' as const,
  timezone: 'UTC', bedtimeGoal: '23:00', wakeTimeGoal: '07:00',
  dashboardTitle: "Jack's Dashboard", accentColor: '#63f0ad',
  dayTrackerStart: '08:00', dayTrackerEnd: '00:00',
  waterUnit: 'mL' as const, bottleSize: 250, activityHours: 5,
  caffeineSensitivity: 'normal' as const, sleepGoal: 8,
  currency: 'USD' as const, currencySymbol: '$', netWorthGoal: 100000,
  macroGoals: { ...DEFAULT_MACRO_GOALS },
};

const DEFAULT_MENTOR = {
  avatarStyle: 'orb' as const, accentColor: '#06b6d4',
  enableBlinking: true, enableIdleSleep: true, enableReminders: true,
  chatCompact: false, showOnMain: true, showOnGym: true,
  showOnFinance: true, showOnHealth: true,
};

const EMPTY_DATA: AppData = {
  profile: { ...DEFAULT_PROFILE },
  goals: [], tasks: [], foodLogs: [], supplements: [], supplementLogs: [],
  waterLogs: [], sleepLogs: [], caffeineLogs: [], readinessLogs: [],
  gymLocations: [], workoutSplits: [], exercises: [],
  workoutSessions: [], workoutSets: [], weightLogs: [],
  progressPhotos: [], accounts: [], investments: [],
  cryptoHoldings: [], otherAssets: [], subscriptions: [],
  orders: [], receipts: [], wishlistItems: [], incomeLogs: [],
  netWorthSnapshots: [], mentorSettings: { ...DEFAULT_MENTOR },
  onboardingComplete: false, demoDataLoaded: false,
};

function loadFromStorage(): AppData {
  if (typeof window === 'undefined') return JSON.parse(JSON.stringify(EMPTY_DATA));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...EMPTY_DATA, ...parsed, profile: { ...EMPTY_DATA.profile, ...parsed.profile }, mentorSettings: { ...EMPTY_DATA.mentorSettings, ...parsed.mentorSettings } };
    }
  } catch {}
  return JSON.parse(JSON.stringify(EMPTY_DATA));
}

function saveToStorage(data: AppData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

type CloudStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface StoreContextType {
  data: AppData;
  synced: boolean;
  cloudStatus: CloudStatus;
  storageMode: 'local' | 'supabase';
  syncPassphrase: string | null;
  setSyncPassphrase: (passphrase: string) => Promise<void>;
  clearSyncPassphrase: () => void;
  loadDemo: () => void;
  resetAll: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  // Profile
  updateProfile: (updates: Partial<AppData['profile']>) => void;
  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleGoal: (id: string) => void;
  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  pushTasks: (date: string) => void;
  reorderTask: (id: string, direction: 'up' | 'down') => void;
  // Supplements
  addSupplement: (s: Omit<Supplement, 'id' | 'createdAt'>) => void;
  updateSupplement: (id: string, updates: Partial<Supplement>) => void;
  deleteSupplement: (id: string) => void;
  toggleSupplement: (id: string, date: string) => void;
  addSupplementLog: (log: Omit<SupplementLog, 'id'>) => void;
  // Food
  addFood: (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  deleteFood: (id: string) => void;
  updateMacroGoals: (goals: Partial<MacroGoals>) => void;
  // Water
  addWater: (log: Omit<WaterLog, 'id'>) => void;
  // Sleep
  addSleep: (log: Omit<SleepLog, 'id' | 'createdAt'>) => void;
  deleteSleep: (id: string) => void;
  // Caffeine
  addCaffeine: (log: Omit<CaffeineLog, 'id'>) => void;
  deleteCaffeine: (id: string) => void;
  // Readiness
  addReadiness: (log: Omit<ReadinessLog, 'id' | 'createdAt'>) => void;
  // Gym
  addGymLocation: (l: Omit<GymLocation, 'id'>) => void;
  deleteGymLocation: (id: string) => void;
  addWorkoutSplit: (s: Omit<WorkoutSplit, 'id'>) => void;
  deleteWorkoutSplit: (id: string) => void;
  addExercise: (e: Omit<Exercise, 'id' | 'createdAt'>) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  startWorkout: (session: Omit<WorkoutSession, 'id' | 'createdAt'>) => string;
  completeWorkout: (sessionId: string) => void;
  addSet: (s: Omit<WorkoutSet, 'id' | 'createdAt'>) => void;
  deleteSet: (id: string) => void;
  // Weight
  addWeight: (w: Omit<WeightLog, 'id' | 'createdAt'>) => void;
  deleteWeight: (id: string) => void;
  // Photos
  addPhoto: (p: Omit<ProgressPhoto, 'id' | 'createdAt'>) => void;
  deletePhoto: (id: string) => void;
  // Finance
  addAccount: (a: Omit<FinanceAccount, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, updates: Partial<FinanceAccount>) => void;
  deleteAccount: (id: string) => void;
  addInvestment: (i: Omit<InvestmentHolding, 'id' | 'createdAt'>) => void;
  deleteInvestment: (id: string) => void;
  addCrypto: (c: Omit<CryptoHolding, 'id' | 'createdAt'>) => void;
  deleteCrypto: (id: string) => void;
  addAsset: (a: Omit<OtherAsset, 'id' | 'createdAt'>) => void;
  deleteAsset: (id: string) => void;
  addSubscription: (s: Omit<Subscription, 'id' | 'createdAt'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  addOrder: (o: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addReceipt: (r: Omit<Receipt, 'id' | 'createdAt'>) => void;
  deleteReceipt: (id: string) => void;
  addWishlistItem: (w: Omit<WishlistItem, 'id' | 'createdAt'>) => void;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteWishlistItem: (id: string) => void;
  purchaseWishlistItem: (id: string) => void;
  addIncome: (i: Omit<IncomeLog, 'id' | 'createdAt'>) => void;
  deleteIncome: (id: string) => void;
  takeSnapshot: () => void;
  updateMentorSettings: (updates: Partial<AppData['mentorSettings']>) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);
  const [synced, setSynced] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle');
  const [syncPassphrase, setSyncPassphraseState] = useState<string | null>(null);


  const doCloudSync = useCallback(async (newData: AppData) => {
    if (!hasSupabase || !getUserId()) return;
    setCloudStatus('syncing');
    const ok = await saveToCloud(newData);
    setSynced(ok);
    setCloudStatus(ok ? 'synced' : 'error');
  }, []);

  useEffect(() => {
    const stored = loadFromStorage();
    const existingPassphrase = getSyncPassphrase();
    setSyncPassphraseState(existingPassphrase);

    if (hasSupabase && existingPassphrase) {
      loadFromCloud().then(cloudData => {
        if (cloudData) {
          setData(cloudData);
          saveToStorage(cloudData);
          setSynced(true);
          setCloudStatus('synced');
        } else {
          setData(stored);
        }
        setLoaded(true);
      });
    } else {
      setData(stored);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      saveToStorage(data);
    }
  }, [data, loaded]);

  useEffect(() => {
    if (loaded && hasSupabase && getUserId()) {
      doCloudSync(data);
    }
  }, [data, loaded, doCloudSync]);

  const persist = useCallback((newData: AppData) => {
    setData(newData);
    saveToStorage(newData);
  }, []);

  const mutate = useCallback((fn: (d: AppData) => AppData) => {
    setData(prev => {
      const next = fn(prev);
      saveToStorage(next);
      return next;
    });
  }, []);

  const handleSetSyncPassphrase = useCallback(async (passphrase: string) => {
    setPassphrase(passphrase);
    setSyncPassphraseState(passphrase);
    setCloudStatus('syncing');
    const cloudData = await loadFromCloud();
    if (cloudData) {
      setData(cloudData);
      saveToStorage(cloudData);
      setSynced(true);
      setCloudStatus('synced');
    } else {
      doCloudSync(data);
    }
  }, [data, doCloudSync]);

  const handleClearSyncPassphrase = useCallback(() => {
    clearSyncPassphrase();
    setSyncPassphraseState(null);
    setSynced(false);
    setCloudStatus('idle');
  }, []);

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen bg-black text-cyan-400">Loading...</div>;
  }

  const ctx: StoreContextType = {
    data,
    synced,
    cloudStatus,
    storageMode: hasSupabase ? 'supabase' : 'local',
    syncPassphrase,
    setSyncPassphrase: handleSetSyncPassphrase,
    clearSyncPassphrase: handleClearSyncPassphrase,
    loadDemo: () => persist(createDemoData()),
    resetAll: () => persist(JSON.parse(JSON.stringify(EMPTY_DATA))),
    exportData: () => JSON.stringify(data, null, 2),
    importData: (json: string) => { try { persist({ ...JSON.parse(json) }); return true; } catch { return false; } },

    updateProfile: (updates) => mutate(d => ({ ...d, profile: { ...d.profile, ...updates } })),

    addGoal: (goal) => mutate(d => ({ ...d, goals: [...d.goals, { ...goal, id: generateId(), createdAt: today() }] })),
    updateGoal: (id, updates) => mutate(d => ({ ...d, goals: d.goals.map(g => g.id === id ? { ...g, ...updates } : g) })),
    deleteGoal: (id) => mutate(d => ({ ...d, goals: d.goals.filter(g => g.id !== id) })),
    toggleGoal: (id) => mutate(d => ({ ...d, goals: d.goals.map(g => g.id === id ? { ...g, completed: !g.completed, completedAt: !g.completed ? today() : undefined } : g) })),

    addTask: (task) => mutate(d => ({ ...d, tasks: [...d.tasks, { ...task, id: generateId(), createdAt: today() }] })),
    updateTask: (id, updates) => mutate(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, ...updates } : t) })),
    deleteTask: (id) => mutate(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) })),
    toggleTask: (id) => mutate(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? today() : undefined } : t) })),
    pushTasks: (date) => mutate(d => ({ ...d, tasks: d.tasks.map(t => t.date === date && !t.completed ? { ...t, date: (() => { const dt = new Date(date + 'T00:00:00'); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0]; })(), pushedFrom: date } : t) })),
    reorderTask: (id, direction) => mutate(d => {
      const tasks = [...d.tasks];
      const idx = tasks.findIndex(t => t.id === id);
      if (direction === 'up' && idx > 0) { [tasks[idx], tasks[idx - 1]] = [tasks[idx - 1], tasks[idx]]; }
      if (direction === 'down' && idx < tasks.length - 1) { [tasks[idx], tasks[idx + 1]] = [tasks[idx + 1], tasks[idx]]; }
      return { ...d, tasks };
    }),

    addSupplement: (s) => mutate(d => ({ ...d, supplements: [...d.supplements, { ...s, id: generateId(), createdAt: today() }] })),
    updateSupplement: (id, updates) => mutate(d => ({ ...d, supplements: d.supplements.map(s => s.id === id ? { ...s, ...updates } : s) })),
    deleteSupplement: (id) => {
      const next = { ...data, supplements: data.supplements.filter(s => s.id !== id), supplementLogs: data.supplementLogs.filter(l => l.supplementId !== id) };
      saveToStorage(next);
      window.location.reload();
    },
    toggleSupplement: (id, date) => mutate(d => {
      const existing = d.supplementLogs.find(l => l.supplementId === id && l.date === date);
      if (existing) {
        return { ...d, supplementLogs: d.supplementLogs.map(l => l.id === existing.id ? { ...l, taken: !l.taken } : l) };
      }
      return { ...d, supplementLogs: [...d.supplementLogs, { id: generateId(), supplementId: id, date, taken: true, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) }] };
    }),
    addSupplementLog: (log) => mutate(d => ({ ...d, supplementLogs: [...d.supplementLogs, { ...log, id: generateId() }] })),

    addFood: (entry) => mutate(d => ({ ...d, foodLogs: [...d.foodLogs, { ...entry, id: generateId(), createdAt: today() }] })),
    deleteFood: (id) => mutate(d => ({ ...d, foodLogs: d.foodLogs.filter(f => f.id !== id) })),
    updateMacroGoals: (goals) => mutate(d => ({ ...d, profile: { ...d.profile, macroGoals: { ...d.profile.macroGoals, ...goals } } })),

    addWater: (log) => mutate(d => ({ ...d, waterLogs: [...d.waterLogs, { ...log, id: generateId() }] })),

    addSleep: (log) => mutate(d => ({ ...d, sleepLogs: [...d.sleepLogs, { ...log, id: generateId(), createdAt: today() }] })),
    deleteSleep: (id) => mutate(d => ({ ...d, sleepLogs: d.sleepLogs.filter(s => s.id !== id) })),

    addCaffeine: (log) => mutate(d => ({ ...d, caffeineLogs: [...d.caffeineLogs, { ...log, id: generateId() }] })),
    deleteCaffeine: (id) => mutate(d => ({ ...d, caffeineLogs: d.caffeineLogs.filter(c => c.id !== id) })),

    addReadiness: (log) => mutate(d => ({ ...d, readinessLogs: [...d.readinessLogs, { ...log, id: generateId(), createdAt: today() }] })),

    addGymLocation: (l) => mutate(d => ({ ...d, gymLocations: [...d.gymLocations, { ...l, id: generateId() }] })),
    deleteGymLocation: (id) => mutate(d => ({ ...d, gymLocations: d.gymLocations.filter(l => l.id !== id) })),
    addWorkoutSplit: (s) => mutate(d => ({ ...d, workoutSplits: [...d.workoutSplits, { ...s, id: generateId() }] })),
    deleteWorkoutSplit: (id) => mutate(d => ({ ...d, workoutSplits: d.workoutSplits.filter(s => s.id !== id) })),
    addExercise: (e) => mutate(d => ({ ...d, exercises: [...d.exercises, { ...e, id: generateId(), createdAt: today() }] })),
    updateExercise: (id, updates) => mutate(d => ({ ...d, exercises: d.exercises.map(e => e.id === id ? { ...e, ...updates } : e) })),
    deleteExercise: (id) => mutate(d => ({ ...d, exercises: d.exercises.filter(e => e.id !== id), workoutSets: d.workoutSets.filter(s => s.exerciseId !== id) })),

    startWorkout: (session) => {
      const id = generateId();
      mutate(d => ({ ...d, workoutSessions: [...d.workoutSessions, { ...session, id, createdAt: today() }] }));
      return id;
    },
    completeWorkout: (sessionId) => mutate(d => ({ ...d, workoutSessions: d.workoutSessions.map(s => s.id === sessionId ? { ...s, completed: true } : s) })),
    addSet: (s) => mutate(d => ({ ...d, workoutSets: [...d.workoutSets, { ...s, id: generateId(), createdAt: today() }] })),
    deleteSet: (id) => mutate(d => ({ ...d, workoutSets: d.workoutSets.filter(s => s.id !== id) })),

    addWeight: (w) => mutate(d => ({ ...d, weightLogs: [...d.weightLogs, { ...w, id: generateId(), createdAt: today() }] })),
    deleteWeight: (id) => mutate(d => ({ ...d, weightLogs: d.weightLogs.filter(w => w.id !== id) })),

    addPhoto: (p) => mutate(d => ({ ...d, progressPhotos: [...d.progressPhotos, { ...p, id: generateId(), createdAt: today() }] })),
    deletePhoto: (id) => mutate(d => ({ ...d, progressPhotos: d.progressPhotos.filter(p => p.id !== id) })),

    addAccount: (a) => mutate(d => ({ ...d, accounts: [...d.accounts, { ...a, id: generateId(), createdAt: today() }] })),
    updateAccount: (id, updates) => mutate(d => ({ ...d, accounts: d.accounts.map(a => a.id === id ? { ...a, ...updates } : a) })),
    deleteAccount: (id) => mutate(d => ({ ...d, accounts: d.accounts.filter(a => a.id !== id) })),

    addInvestment: (i) => mutate(d => ({ ...d, investments: [...d.investments, { ...i, id: generateId(), createdAt: today() }] })),
    deleteInvestment: (id) => mutate(d => ({ ...d, investments: d.investments.filter(i => i.id !== id) })),

    addCrypto: (c) => mutate(d => ({ ...d, cryptoHoldings: [...d.cryptoHoldings, { ...c, id: generateId(), createdAt: today() }] })),
    deleteCrypto: (id) => mutate(d => ({ ...d, cryptoHoldings: d.cryptoHoldings.filter(c => c.id !== id) })),

    addAsset: (a) => mutate(d => ({ ...d, otherAssets: [...d.otherAssets, { ...a, id: generateId(), createdAt: today() }] })),
    deleteAsset: (id) => mutate(d => ({ ...d, otherAssets: d.otherAssets.filter(a => a.id !== id) })),

    addSubscription: (s) => mutate(d => ({ ...d, subscriptions: [...d.subscriptions, { ...s, id: generateId(), createdAt: today() }] })),
    updateSubscription: (id, updates) => mutate(d => ({ ...d, subscriptions: d.subscriptions.map(s => s.id === id ? { ...s, ...updates } : s) })),
    deleteSubscription: (id) => mutate(d => ({ ...d, subscriptions: d.subscriptions.filter(s => s.id !== id) })),

    addOrder: (o) => mutate(d => ({ ...d, orders: [...d.orders, { ...o, id: generateId(), createdAt: today() }] })),
    updateOrder: (id, updates) => mutate(d => ({ ...d, orders: d.orders.map(o => o.id === id ? { ...o, ...updates } : o) })),
    deleteOrder: (id) => mutate(d => ({ ...d, orders: d.orders.filter(o => o.id !== id) })),

    addReceipt: (r) => mutate(d => ({ ...d, receipts: [...d.receipts, { ...r, id: generateId(), createdAt: today() }] })),
    deleteReceipt: (id) => mutate(d => ({ ...d, receipts: d.receipts.filter(r => r.id !== id) })),

    addWishlistItem: (w) => mutate(d => ({ ...d, wishlistItems: [...d.wishlistItems, { ...w, id: generateId(), createdAt: today() }] })),
    updateWishlistItem: (id, updates) => mutate(d => ({ ...d, wishlistItems: d.wishlistItems.map(w => w.id === id ? { ...w, ...updates } : w) })),
    deleteWishlistItem: (id) => mutate(d => ({ ...d, wishlistItems: d.wishlistItems.filter(w => w.id !== id) })),
    purchaseWishlistItem: (id) => mutate(d => ({ ...d, wishlistItems: d.wishlistItems.map(w => w.id === id ? { ...w, purchased: true } : w) })),

    addIncome: (i) => mutate(d => ({ ...d, incomeLogs: [...d.incomeLogs, { ...i, id: generateId(), createdAt: today() }] })),
    deleteIncome: (id) => mutate(d => ({ ...d, incomeLogs: d.incomeLogs.filter(i => i.id !== id) })),

    takeSnapshot: () => {
      const d = today();
      const accounts = data.accounts.filter(a => a.includeInNetWorth).reduce((s, a) => s + a.balance, 0);
      const investments = data.investments.reduce((s, i) => s + i.shares * i.manualPrice, 0);
      const crypto = data.cryptoHoldings.reduce((s, c) => s + c.amount * c.manualPrice, 0);
      const assets = data.otherAssets.filter(a => a.includeInNetWorth).reduce((s, a) => s + a.value, 0);
      const snapshot: NetWorthSnapshot = { id: generateId(), date: d, totalNetWorth: accounts + investments + crypto + assets, accounts, investments, crypto, assets, createdAt: d };
      mutate(prev => ({ ...prev, netWorthSnapshots: [...prev.netWorthSnapshots, snapshot] }));
    },

    updateMentorSettings: (updates) => mutate(d => ({ ...d, mentorSettings: { ...d.mentorSettings, ...updates } })),
  };

  return <StoreContext.Provider value={ctx}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
