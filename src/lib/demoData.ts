import { AppData } from './types';
import { generateId, today } from './utils';

export function createDemoData(): AppData {
  const d = today();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tStr = tomorrow.toISOString().split('T')[0];
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
  const nwStr = nextWeek.toISOString().split('T')[0];

  const goals: AppData['goals'] = [
    { id: generateId(), title: 'Finish homework assignment', dueDate: d, priority: 'high', category: 'school', completed: false, createdAt: d },
    { id: generateId(), title: 'Hit gym 4x this week', dueDate: tStr, priority: 'medium', category: 'gym', completed: false, createdAt: d },
    { id: generateId(), title: 'Make TikTok content', dueDate: tStr, priority: 'low', category: 'personal', completed: false, createdAt: d },
    { id: generateId(), title: 'Study for exam', dueDate: nwStr, priority: 'high', category: 'school', completed: false, createdAt: d },
  ];

  const tasks: AppData['tasks'] = [
    { id: generateId(), title: 'Read chapter 5', date: d, priority: 'high', category: 'school', completed: false, createdAt: d },
    { id: generateId(), title: 'Buy groceries', date: d, priority: 'medium', category: 'personal', completed: false, createdAt: d },
    { id: generateId(), title: 'Reply to emails', date: d, priority: 'low', category: 'work', completed: false, createdAt: d },
  ];

  const foodLogs: AppData['foodLogs'] = [
    { id: generateId(), name: 'Chicken breast', calories: 284, protein: 43, carbs: 0, fat: 6, mealType: 'lunch', date: d, createdAt: d },
    { id: generateId(), name: 'White rice', calories: 206, protein: 4, carbs: 45, fat: 0.4, mealType: 'lunch', date: d, createdAt: d },
    { id: generateId(), name: 'Protein shake', calories: 180, protein: 30, carbs: 5, fat: 3, mealType: 'snack', date: d, createdAt: d },
    { id: generateId(), name: 'Oatmeal', calories: 300, protein: 10, carbs: 54, fat: 5, mealType: 'breakfast', date: d, createdAt: d },
  ];

  const supplements: AppData['supplements'] = [
    { id: generateId(), name: 'Creatine Monohydrate', dose: '5', unit: 'g', schedule: 'morning', windowStart: '07:00', windowEnd: '10:00', runningLow: true, stockCount: 7, isCustom: false, createdAt: d },
    { id: generateId(), name: 'Magnesium Glycinate', dose: '200', unit: 'mg', schedule: 'evening', windowStart: '18:00', windowEnd: '22:00', runningLow: false, stockCount: 30, isCustom: false, createdAt: d },
    { id: generateId(), name: 'L-Theanine', dose: '100', unit: 'mg', schedule: 'morning', windowStart: '07:00', windowEnd: '10:00', runningLow: false, stockCount: 60, isCustom: false, createdAt: d },
    { id: generateId(), name: 'Vitamin D', dose: '2000', unit: 'IU', schedule: 'morning', windowStart: '07:00', windowEnd: '10:00', runningLow: false, stockCount: 90, isCustom: false, createdAt: d },
  ];

  const supplementLogs: AppData['supplementLogs'] = supplements.map(s => ({
    id: generateId(), supplementId: s.id, date: d, taken: false
  }));

  const waterLogs: AppData['waterLogs'] = [
    { id: generateId(), date: d, amount: 250, unit: 'mL', timestamp: '08:30' },
    { id: generateId(), date: d, amount: 250, unit: 'mL', timestamp: '10:15' },
  ];

  const sleepLogs: AppData['sleepLogs'] = [
    { id: generateId(), date: d, bedtime: '23:00', wakeTime: '07:00', duration: 8, quality: 7, notes: 'Good sleep', isNap: false, createdAt: d },
    { id: generateId(), date: getDateStr(-1), bedtime: '23:30', wakeTime: '06:30', duration: 7, quality: 6, isNap: false, createdAt: getDateStr(-1) },
    { id: generateId(), date: getDateStr(-2), bedtime: '00:00', wakeTime: '07:00', duration: 7, quality: 5, notes: 'Woke up once', isNap: false, createdAt: getDateStr(-2) },
  ];

  const caffeineLogs: AppData['caffeineLogs'] = [
    { id: generateId(), date: d, drinkName: 'Coffee', caffeineMg: 95, servingSize: '1 cup', timestamp: '08:00', isCustom: false },
    { id: generateId(), date: d, drinkName: 'Green Tea', caffeineMg: 28, servingSize: '1 cup', timestamp: '12:00', isCustom: false },
  ];

  const gymLocations: AppData['gymLocations'] = [
    { id: generateId(), name: 'Main Gym' },
    { id: generateId(), name: 'Home Gym' },
  ];

  const workoutSplits: AppData['workoutSplits'] = [
    { id: generateId(), day: 'push', name: 'Push Day', order: 1 },
    { id: generateId(), day: 'pull', name: 'Pull Day', order: 2 },
    { id: generateId(), day: 'legs', name: 'Leg Day', order: 3 },
    { id: generateId(), day: 'rest', name: 'Rest Day', order: 4 },
  ];

  const exercises: AppData['exercises'] = [
    { id: generateId(), name: 'DB Press', startingWeight: 20, weightUnit: 'kg', repRangeMin: 6, repRangeMax: 8, increment: 2, locationId: gymLocations[0].id, createdAt: d },
    { id: generateId(), name: 'Pull Ups', startingWeight: 0, weightUnit: 'kg', repRangeMin: 8, repRangeMax: 12, increment: 1, locationId: gymLocations[0].id, createdAt: d },
    { id: generateId(), name: 'Squat', startingWeight: 60, weightUnit: 'kg', repRangeMin: 5, repRangeMax: 8, increment: 2.5, locationId: gymLocations[0].id, createdAt: d },
    { id: generateId(), name: 'Deadlift', startingWeight: 80, weightUnit: 'kg', repRangeMin: 5, repRangeMax: 8, increment: 5, locationId: gymLocations[0].id, createdAt: d },
  ];

  const accounts: AppData['accounts'] = [
    { id: generateId(), name: 'Star One', balance: 2500, currency: 'USD', type: 'checking', includeInNetWorth: true, createdAt: d },
    { id: generateId(), name: 'Savings', balance: 8000, currency: 'USD', type: 'savings', includeInNetWorth: true, createdAt: d },
    { id: generateId(), name: 'Cash', balance: 200, currency: 'USD', type: 'cash', includeInNetWorth: true, createdAt: d },
  ];

  const investments: AppData['investments'] = [
    { id: generateId(), accountId: accounts[0].id, name: 'Vanguard ETF', ticker: 'VOO', shares: 5, manualPrice: 450, createdAt: d },
  ];

  const cryptoHoldings: AppData['cryptoHoldings'] = [
    { id: generateId(), name: 'Bitcoin', symbol: 'BTC', amount: 0.01, manualPrice: 65000, createdAt: d },
  ];

  const subscriptions: AppData['subscriptions'] = [
    { id: generateId(), name: 'Claude Pro', amount: 20, renewalDate: getDateStr(12), frequency: 'monthly', accountId: accounts[0].id, autoDeduct: true, category: 'AI', cancelled: false, usage: 'often', createdAt: d },
    { id: generateId(), name: 'Spotify', amount: 12, renewalDate: getDateStr(8), frequency: 'monthly', accountId: accounts[0].id, autoDeduct: true, category: 'Music', cancelled: false, usage: 'often', createdAt: d },
    { id: generateId(), name: 'Apple One', amount: 33, renewalDate: getDateStr(3), frequency: 'monthly', accountId: accounts[0].id, autoDeduct: true, category: 'Services', cancelled: false, usage: 'sometimes', createdAt: d },
    { id: generateId(), name: 'Canva Pro', amount: 13, renewalDate: getDateStr(20), frequency: 'monthly', accountId: accounts[0].id, autoDeduct: false, category: 'Design', cancelled: false, usage: 'rarely', createdAt: d },
  ];

  const orders: AppData['orders'] = [
    { id: generateId(), itemName: 'MacBook Pro', price: 2499, dateBought: getDateStr(-2), expectedDelivery: getDateStr(2), accountId: accounts[0].id, status: 'shipped', deductFromAccount: true, createdAt: d },
    { id: generateId(), itemName: 'iPhone 16 Pro', price: 1499, dateBought: getDateStr(-5), expectedDelivery: getDateStr(1), accountId: accounts[0].id, status: 'shipped', deductFromAccount: true, createdAt: d },
  ];

  const wishlistItems: AppData['wishlistItems'] = [
    { id: generateId(), name: 'Lamborghini Huracan', price: 250000, category: 'Car', priority: 'low', notes: 'Maybe one day', purchased: false, createdAt: d },
    { id: generateId(), name: 'Sony A7 IV', price: 2500, category: 'Camera', priority: 'medium', purchased: false, createdAt: d },
    { id: generateId(), name: 'New Gaming PC', price: 3000, category: 'Tech', priority: 'high', purchased: false, createdAt: d },
  ];

  const incomeLogs: AppData['incomeLogs'] = [
    { id: generateId(), source: 'Salary', amount: 5000, date: getDateStr(-5), accountId: accounts[0].id, recurring: true, frequency: 'monthly', createdAt: d },
  ];

  const weightLogs: AppData['weightLogs'] = [
    { id: generateId(), date: getDateStr(-6), weight: 75, unit: 'kg', createdAt: getDateStr(-6) },
    { id: generateId(), date: getDateStr(-4), weight: 74.8, unit: 'kg', createdAt: getDateStr(-4) },
    { id: generateId(), date: getDateStr(-2), weight: 75.2, unit: 'kg', createdAt: getDateStr(-2) },
    { id: generateId(), date: d, weight: 75, unit: 'kg', createdAt: d },
  ];

  const profile: AppData['profile'] = {
    name: 'Jack',
    age: 25,
    height: 175,
    weight: 75,
    weightUnit: 'kg',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    bedtimeGoal: '23:00',
    wakeTimeGoal: '07:00',
    dashboardTitle: "Jack's Dashboard",
    accentColor: '#06b6d4',
    dayTrackerStart: '08:00',
    dayTrackerEnd: '00:00',
    waterUnit: 'mL',
    bottleSize: 250,
    activityHours: 5,
    caffeineSensitivity: 'normal',
    sleepGoal: 8,
    currency: 'USD',
    currencySymbol: '$',
    netWorthGoal: 100000,
    macroGoals: { calories: 2500, protein: 180, carbs: 250, fat: 70 },
  };

  return {
    profile, goals, tasks, foodLogs, supplements, supplementLogs,
    waterLogs, sleepLogs, caffeineLogs, readinessLogs: [],
    gymLocations, workoutSplits, exercises, workoutSessions: [],
    workoutSets: [], weightLogs, progressPhotos: [],
    accounts, investments, cryptoHoldings, otherAssets: [],
    subscriptions, orders, receipts: [], wishlistItems,
    incomeLogs, netWorthSnapshots: [],
    mentorSettings: {
      avatarStyle: 'orb', accentColor: '#06b6d4', enableBlinking: true,
      enableIdleSleep: true, enableReminders: true, chatCompact: false,
      showOnMain: true, showOnGym: true, showOnFinance: true, showOnHealth: true
    },
    onboardingComplete: true,
    demoDataLoaded: true,
  };
}

function getDateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}
