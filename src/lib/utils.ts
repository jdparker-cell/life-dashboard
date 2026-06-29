import {
  AppData, UserProfile, WaterLog, SleepLog, CaffeineLog, WeightLog,
  WorkoutSet, Exercise, Subscription, WishlistItem, FinanceAccount,
  InvestmentHolding, CryptoHolding, OtherAsset, Goal, Supplement,
  SupplementLog, ReadinessLog, Order, FoodEntry, MacroGoals
} from './types';

export function calculateWaterTarget(profile: UserProfile): number {
  const weightKg = profile.weightUnit === 'lb' ? profile.weight * 0.453592 : profile.weight;
  let base = weightKg * 33;
  base += profile.activityHours * 300;
  if (profile.caffeineSensitivity === 'high') base += 200;
  return Math.round(base);
}

export function calculateSleepDebt(logs: SleepLog[], goal: number): number {
  const last7 = logs.filter(l => !l.isNap).slice(-7);
  const total = last7.reduce((s, l) => s + l.duration, 0);
  return Math.max(0, goal * 7 - total);
}

export function calculateReadinessScore(log: Partial<ReadinessLog>): number {
  let score = 50;
  if (log.sleepDuration) score += Math.min(20, (log.sleepDuration / 8) * 20);
  if (log.sleepQuality) score += (log.sleepQuality / 10) * 10;
  if (log.energy) score += (log.energy / 10) * 10;
  if (log.focus) score += (log.focus / 10) * 10;
  if (log.mood) score += (log.mood / 10) * 5;
  if (log.stress) score -= (log.stress / 10) * 5;
  if (log.soreness) score -= (log.soreness / 10) * 5;
  if (log.caffeineMg && log.caffeineMg > 200) score -= 5;
  if (log.caffeineMg && log.caffeineMg > 400) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateCaffeineCurve(logs: CaffeineLog[], sensitivity: string): { time: string; level: number }[] {
  const points: { time: string; level: number }[] = [];
  const halfLife = sensitivity === 'high' ? 3 : sensitivity === 'low' ? 7 : 5;
  for (let h = 8; h <= 24; h++) {
    let level = 0;
    for (const log of logs) {
      const logHour = parseInt(log.timestamp.split(':')[0]);
      const hoursSince = h - logHour;
      if (hoursSince >= 0) {
        level += log.caffeineMg * Math.pow(0.5, hoursSince / halfLife);
      }
    }
    const hourStr = `${h.toString().padStart(2, '0')}:00`;
    const dayH = h >= 24 ? h - 24 : h;
    const label = `${dayH.toString().padStart(2, '0')}:00`;
    points.push({ time: label, level: Math.round(level) });
  }
  return points;
}

export function estimateCaffeineRemaining(logs: CaffeineLog[], bedtime: string, sensitivity: string): number {
  const halfLife = sensitivity === 'high' ? 3 : sensitivity === 'low' ? 7 : 5;
  const bedHour = parseInt(bedtime.split(':')[0]);
  let remaining = 0;
  for (const log of logs) {
    const logHour = parseInt(log.timestamp.split(':')[0]);
    let hoursUntil = bedHour - logHour;
    if (hoursUntil < 0) hoursUntil += 24;
    if (hoursUntil > 0) {
      remaining += log.caffeineMg * Math.pow(0.5, hoursUntil / halfLife);
    }
  }
  return Math.round(remaining);
}

export function calculatePeakFocusWindow(logs: CaffeineLog[], sleepLogs: SleepLog[], profile: UserProfile): { start: string; end: string } | null {
  const todayCaffeine = logs.filter(l => l.date === today());
  if (todayCaffeine.length === 0) return null;
  const latest = todayCaffeine.reduce((a, b) => a.timestamp > b.timestamp ? a : b);
  const hour = parseInt(latest.timestamp.split(':')[0]);
  const startHour = Math.min(24, hour + 1);
  const endHour = Math.min(24, startHour + 3);
  return {
    start: `${startHour.toString().padStart(2, '0')}:00`,
    end: `${endHour.toString().padStart(2, '0')}:00`
  };
}

export function calculateNetWorth(data: AppData): number {
  const accounts = data.accounts.filter(a => a.includeInNetWorth).reduce((s, a) => s + a.balance, 0);
  const investments = data.investments.reduce((s, i) => s + i.shares * i.manualPrice, 0);
  const crypto = data.cryptoHoldings.reduce((s, c) => s + c.amount * c.manualPrice, 0);
  const assets = data.otherAssets.filter(a => a.includeInNetWorth).reduce((s, a) => s + a.value, 0);
  return accounts + investments + crypto + assets;
}

export function calculateOnePercentNetWorth(netWorth: number): number {
  return netWorth / 100;
}

export function calculateSubscriptionTotals(subscriptions: Subscription[]): { monthly: number; yearly: number } {
  const active = subscriptions.filter(s => !s.cancelled);
  let monthly = 0;
  let yearly = 0;
  for (const sub of active) {
    if (sub.frequency === 'monthly') { monthly += sub.amount; yearly += sub.amount * 12; }
    else if (sub.frequency === 'yearly') { monthly += sub.amount / 12; yearly += sub.amount; }
    else if (sub.frequency === 'weekly') { monthly += sub.amount * 4.33; yearly += sub.amount * 52; }
    else { monthly += sub.amount; yearly += sub.amount * 12; }
  }
  return { monthly: Math.round(monthly), yearly: Math.round(yearly) };
}

export function calculateWishlistAffordability(item: WishlistItem, netWorth: number): { percent: number; status: string } {
  if (netWorth <= 0) return { percent: 0, status: 'Not realistic yet' };
  const pct = (item.price / netWorth) * 100;
  if (pct < 1) return { percent: Math.round(pct * 100) / 100, status: 'Safe' };
  if (pct < 5) return { percent: Math.round(pct * 100) / 100, status: 'Consider carefully' };
  if (pct < 20) return { percent: Math.round(pct * 100) / 100, status: 'Expensive' };
  return { percent: Math.round(pct * 100) / 100, status: 'Not realistic yet' };
}

export function calculateProgressiveOverloadSuggestion(exercise: Exercise, recentSets: WorkoutSet[]): { message: string; shouldIncrease: boolean } {
  if (recentSets.length === 0) return { message: 'No data yet. Start with the recommended rep range.', shouldIncrease: false };
  const topReps = Math.max(...recentSets.map(s => s.reps));
  const avgWeight = recentSets.reduce((s, set) => s + set.weight, 0) / recentSets.length;
  const maxWeight = Math.max(...recentSets.map(s => s.weight));
  if (topReps >= exercise.repRangeMax) {
    const newWeight = avgWeight + exercise.increment;
    return {
      message: `You hit ${topReps} reps. Time to add ${exercise.increment}${exercise.weightUnit}. Expect around ${exercise.repRangeMin - 1}–${exercise.repRangeMin + 1} reps next session.`,
      shouldIncrease: true
    };
  }
  if (topReps < exercise.repRangeMin) {
    return {
      message: `You only hit ${topReps} reps. Stay at ${Math.round(avgWeight)}${exercise.weightUnit} and aim for ${exercise.repRangeMin}+ next time.`,
      shouldIncrease: false
    };
  }
  return {
    message: `Good progress. Keep at ${Math.round(avgWeight)}${exercise.weightUnit} and aim for ${exercise.repRangeMax} reps.`,
    shouldIncrease: false
  };
}

export function estimateBodyCompositionTrend(weightLogs: WeightLog[], exerciseProgress: { weight: number; reps: number }[][]): { trend: 'muscle-gain' | 'fat-gain' | 'fat-loss' | 'maintenance' | 'uncertain'; description: string } {
  if (weightLogs.length < 2) return { trend: 'uncertain', description: 'Need more data to estimate body composition trends.' };
  const recent = weightLogs.slice(-7);
  const oldest = recent[0];
  const latest = recent[recent.length - 1];
  const weightChange = latest.weight - oldest.weight;
  const strengthMaintained = exerciseProgress.some(prog => prog.length >= 2 && prog[prog.length - 1].weight >= prog[0].weight);
  if (weightChange > 0.5 && strengthMaintained) return { trend: 'muscle-gain', description: 'Estimated lean mass gain. Weight is up and strength is improving.' };
  if (weightChange > 0.5 && !strengthMaintained) return { trend: 'fat-gain', description: 'Possible fat/water gain. Weight is up but strength has not increased.' };
  if (weightChange < -0.5 && strengthMaintained) return { trend: 'fat-loss', description: 'Estimated fat loss. Weight is down and strength is maintained.' };
  if (weightChange < -0.5 && !strengthMaintained) return { trend: 'uncertain', description: 'Weight is down but so is strength. Could be muscle loss or recovery phase.' };
  return { trend: 'maintenance', description: 'Weight is stable with minimal change.' };
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatCurrency(amount: number, symbol: string = '$'): string {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function daysUntil(date: string): number {
  const target = new Date(date + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: string): boolean {
  return daysUntil(date) < 0;
}

export function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

export function streakFromLogs<T extends { date: string }>(logs: T[], dateKey: keyof T, date: string): number {
  let streak = 0;
  const current = new Date(date + 'T00:00:00');
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(current);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasEntry = logs.some(l => l[dateKey] === dateStr);
    if (hasEntry) streak++;
    else break;
  }
  return streak;
}

export function calculateMacroProgress(foodLogs: FoodEntry[], macroGoals: MacroGoals): {
  calories: number; protein: number; carbs: number; fat: number;
  caloriesPct: number; proteinPct: number; carbsPct: number; fatPct: number;
} {
  const calories = foodLogs.reduce((s, f) => s + f.calories, 0);
  const protein = foodLogs.reduce((s, f) => s + f.protein, 0);
  const carbs = foodLogs.reduce((s, f) => s + f.carbs, 0);
  const fat = foodLogs.reduce((s, f) => s + f.fat, 0);
  return {
    calories, protein, carbs, fat,
    caloriesPct: macroGoals.calories > 0 ? Math.min(100, Math.round((calories / macroGoals.calories) * 100)) : 0,
    proteinPct: macroGoals.protein > 0 ? Math.min(100, Math.round((protein / macroGoals.protein) * 100)) : 0,
    carbsPct: macroGoals.carbs > 0 ? Math.min(100, Math.round((carbs / macroGoals.carbs) * 100)) : 0,
    fatPct: macroGoals.fat > 0 ? Math.min(100, Math.round((fat / macroGoals.fat) * 100)) : 0,
  };
}

export function generateCoachAdvice(data: AppData, date: string): { score: number; readout: string; tip: string } {
  const todayFood = data.foodLogs.filter(f => f.date === date);
  const goals = data.profile.macroGoals;
  const progress = calculateMacroProgress(todayFood, goals);
  let score = 5;
  const issues: string[] = [];

  if (progress.proteinPct >= 80) { score += 2; }
  else if (progress.proteinPct >= 50) { score += 1; }
  else { issues.push('protein is low'); }

  if (progress.caloriesPct >= 90) { score += 1; }
  else if (progress.caloriesPct < 40) { issues.push('calories are well under target'); }
  else if (progress.caloriesPct < 70) { issues.push('calories could be higher'); }

  if (progress.carbsPct > 120) { issues.push('carbs are over target'); }
  if (progress.fatPct > 120) { issues.push('fat is over target'); }

  const proteinSources = todayFood.filter(f => f.protein > 15);
  let readout = '';
  if (proteinSources.length > 0) {
    readout = `${Math.round(progress.protein)}g protein from ${proteinSources.length} clean source${proteinSources.length > 1 ? 's' : ''} is a solid foundation. `;
  } else {
    readout = 'No significant protein sources logged yet today. ';
  }

  if (issues.length > 0) {
    readout += issues.join('. ') + '. ';
  }

  const tip = issues.length > 0
    ? `Focus on getting more ${issues[0]} in your next meal.`
    : 'Keep meals simple and intentional. Great tracking today!';

  score = Math.max(1, Math.min(10, score));
  return { score, readout, tip };
}

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function calculateSleepDuration(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let hours = wh - bh;
  let mins = wm - bm;
  if (hours < 0) hours += 24;
  return Math.round((hours + mins / 60) * 10) / 10;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    school: '#3b82f6', gym: '#10b981', health: '#f59e0b',
    finance: '#8b5cf6', personal: '#ec4899', work: '#06b6d4', other: '#6b7280'
  };
  return colors[category] || colors.other;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
  return colors[priority] || colors.medium;
}

export function getAffordabilityColor(status: string): string {
  const colors: Record<string, string> = {
    'Safe': '#22c55e', 'Consider carefully': '#f59e0b',
    'Expensive': '#ef4444', 'Not realistic yet': '#6b7280'
  };
  return colors[status] || '#6b7280';
}

export function isInTimeWindow(schedule: string, windowStart: string, windowEnd: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseInt(windowStart.split(':')[0]) * 60 + parseInt(windowStart.split(':')[1] || '0');
  const endMinutes = parseInt(windowEnd.split(':')[0]) * 60 + parseInt(windowEnd.split(':')[1] || '0');
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

export interface TickerAlert {
  id: string;
  text: string;
  priority: number;
  type: 'urgent' | 'warning' | 'info' | 'positive';
}

export function generateTickerAlerts(data: AppData, date: string): TickerAlert[] {
  const alerts: TickerAlert[] = [];
  const todayTasks = data.tasks.filter(t => t.date === date && !t.completed);
  const highPriority = todayTasks.filter(t => t.priority === 'high');
  if (highPriority.length > 0) {
    alerts.push({ id: 'hp-tasks', text: `${highPriority.length} high-priority task${highPriority.length > 1 ? 's' : ''} due today`, priority: 1, type: 'urgent' });
  }
  const overdueGoals = data.goals.filter(g => !g.completed && g.dueDate < date);
  if (overdueGoals.length > 0) {
    alerts.push({ id: 'overdue-goals', text: `${overdueGoals.length} overdue goal${overdueGoals.length > 1 ? 's' : ''}`, priority: 1, type: 'urgent' });
  }
  const todaySupplements = data.supplements.filter(s => {
    const log = data.supplementLogs.find(l => l.supplementId === s.id && l.date === date);
    return !log?.taken;
  });
  for (const sup of todaySupplements) {
    const [sh, sm] = (sup.windowStart || '07:00').split(':').map(Number);
    const [eh, em] = (sup.windowEnd || '22:00').split(':').map(Number);
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const endMin = eh * 60 + em;
    if (currentMin > endMin) {
      alerts.push({ id: `sup-${sup.id}`, text: `${sup.name} not taken — window closed`, priority: 1, type: 'urgent' });
    }
  }
  const lowSupplements = data.supplements.filter(s => s.runningLow);
  for (const sup of lowSupplements) {
    alerts.push({ id: `low-${sup.id}`, text: `${sup.name} is running low`, priority: 2, type: 'warning' });
  }
  const todayWater = data.waterLogs.filter(l => l.date === date);
  const waterTarget = calculateWaterTarget(data.profile);
  const waterTotal = todayWater.reduce((s, l) => s + l.amount, 0);
  if (waterTarget > 0 && waterTotal < waterTarget * 0.5) {
    alerts.push({ id: 'water', text: `${Math.round((waterTarget - waterTotal) / (data.profile.bottleSize || 250))} bottles of water remaining`, priority: 2, type: 'warning' });
  }
  const upcomingSubs = data.subscriptions.filter(s => !s.cancelled && s.renewalDate >= date);
  for (const sub of upcomingSubs) {
    const d = daysUntil(sub.renewalDate);
    if (d >= 0 && d <= 5) {
      alerts.push({ id: `sub-${sub.id}`, text: `${sub.name} renews in ${d} day${d !== 1 ? 's' : ''}`, priority: d <= 1 ? 1 : 3, type: d <= 1 ? 'urgent' : 'warning' });
    }
  }
  const orders = data.orders.filter(o => o.expectedDelivery && o.status !== 'delivered' && o.status !== 'cancelled');
  for (const order of orders) {
    const d = daysUntil(order.expectedDelivery!);
    if (d >= 0 && d <= 3) {
      alerts.push({ id: `order-${order.id}`, text: `${order.itemName} arriving in ${d} day${d !== 1 ? 's' : ''}`, priority: d <= 1 ? 1 : 3, type: 'info' });
    }
  }
  const todayCaffeine = data.caffeineLogs.filter(l => l.date === date);
  const totalCaf = todayCaffeine.reduce((s, l) => s + l.caffeineMg, 0);
  if (totalCaf > 400) {
    alerts.push({ id: 'caf-high', text: `Caffeine high: ${totalCaf}mg today`, priority: 2, type: 'warning' });
  }
  const sleepDebt = calculateSleepDebt(data.sleepLogs, data.profile.sleepGoal || 8);
  if (sleepDebt > 2) {
    alerts.push({ id: 'sleep-debt', text: `Sleep debt: ${Math.round(sleepDebt * 10) / 10}h behind`, priority: 2, type: 'warning' });
  }
  const todayWorkout = data.workoutSessions.find(s => s.date === date);
  if (!todayWorkout) {
    const splitToday = data.workoutSplits.find(s => {
      const dayIndex = new Date(date + 'T00:00:00').getDay();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return s.day.toLowerCase() === days[dayIndex].substring(0, 3);
    });
    if (splitToday && splitToday.day !== 'rest') {
      alerts.push({ id: 'gym-reminder', text: `${splitToday.name} workout today`, priority: 3, type: 'info' });
    }
  }
  const netWorth = calculateNetWorth(data);
  const netWorthGoal = data.profile.netWorthGoal || 0;
  if (netWorthGoal > 0) {
    const progress = Math.min(100, Math.round((netWorth / netWorthGoal) * 100));
    alerts.push({ id: 'nw-goal', text: `Net worth goal: ${progress}% complete`, priority: 4, type: 'positive' });
  }
  return alerts.sort((a, b) => a.priority - b.priority);
}

export function generateMentorAdvice(data: AppData, date: string): { response: string; insights: string[] } {
  const insights: string[] = [];
  const tasks = data.tasks.filter(t => t.date === date && !t.completed);
  const highPriority = tasks.filter(t => t.priority === 'high');
  if (highPriority.length > 0) {
    insights.push(`Your next move should be: **${highPriority[0].title}**. It's your highest-priority task.`);
  }
  const todayWater = data.waterLogs.filter(l => l.date === date);
  const waterTarget = calculateWaterTarget(data.profile);
  const waterTotal = todayWater.reduce((s, l) => s + l.amount, 0);
  if (waterTarget > 0 && waterTotal < waterTarget * 0.7) {
    insights.push(`You're behind on water (${Math.round(waterTotal / (data.profile.bottleSize || 250))}/${Math.round(waterTarget / (data.profile.bottleSize || 250))} bottles). Add one now.`);
  }
  const lastSleep = data.sleepLogs.filter(l => !l.isNap).slice(-1)[0];
  if (lastSleep && lastSleep.quality < 6) {
    insights.push(`Your sleep score was ${lastSleep.quality}/10 last night. Keep deep work shorter and avoid late caffeine.`);
  }
  const todayCaffeine = data.caffeineLogs.filter(l => l.date === date);
  const totalCaf = todayCaffeine.reduce((s, l) => s + l.caffeineMg, 0);
  const bedHour = parseInt((data.profile.bedtimeGoal || '23:00').split(':')[0]);
  const now = new Date();
  if (totalCaf > 0 && now.getHours() >= bedHour - 4) {
    insights.push(`You logged caffeine close to bedtime. Your sleep goal may be harder to hit tonight.`);
  }
  if (tasks.length === 0 && highPriority.length === 0) {
    insights.push(`All tasks are done for today! Time to relax or work on longer-term goals.`);
  }
  const workouts = data.workoutSessions.filter(s => s.completed).slice(-5);
  if (workouts.length > 0) {
    const recentSets = data.workoutSets.filter(s => s.sessionId === workouts[workouts.length - 1]?.id);
    for (const exercise of data.exercises) {
      const exSets = recentSets.filter(s => s.exerciseId === exercise.id);
      if (exSets.length > 0) {
        const suggestion = calculateProgressiveOverloadSuggestion(exercise, exSets);
        if (suggestion.shouldIncrease) {
          insights.push(`Your strength is trending up on ${exercise.name}. ${suggestion.message}`);
          break;
        }
      }
    }
  }
  const upcomingSubs = data.subscriptions.filter(s => !s.cancelled);
  for (const sub of upcomingSubs) {
    const d = daysUntil(sub.renewalDate);
    if (d >= 0 && d <= 3) {
      insights.push(`**${sub.name}** renews in ${d} day${d !== 1 ? 's' : ''}. Review whether you still use it.`);
    }
    if (sub.usage === 'rarely' || sub.usage === 'not-used') {
      insights.push(`You marked **${sub.name}** as "${sub.usage.replace('-', ' ')}". Consider reviewing this subscription.`);
    }
  }
  const sleepDebt = calculateSleepDebt(data.sleepLogs, data.profile.sleepGoal || 8);
  if (sleepDebt > 3) {
    insights.push(`You're ${Math.round(sleepDebt * 10) / 10}h behind your weekly sleep goal. Aim for an earlier bedtime tonight.`);
  } else if (sleepDebt > 1) {
    insights.push(`Your sleep debt is ${Math.round(sleepDebt * 10) / 10}h. Try to catch up an extra 30 min tonight.`);
  }
  const netWorth = calculateNetWorth(data);
  if (netWorth > 0) {
    insights.push(`Your net worth is **${formatCurrency(netWorth, data.profile.currencySymbol || '$')}**.`);
    const subs = calculateSubscriptionTotals(data.subscriptions);
    if (subs.monthly > 0) {
      insights.push(`Your subscriptions total **${formatCurrency(subs.monthly, data.profile.currencySymbol || '$')}/month**.`);
    }
  } else {
    insights.push(`Start tracking your finances to get personalized insights.`);
  }
  const wishlistItems = data.wishlistItems.filter(i => !i.purchased);
  if (wishlistItems.length > 0 && netWorth > 0) {
    const cheapest = wishlistItems.reduce((a, b) => a.price < b.price ? a : b);
    const afford = calculateWishlistAffordability(cheapest, netWorth);
    insights.push(`Your cheapest wishlist item (${cheapest.name}) is ${afford.percent}% of your net worth — ${afford.status}.`);
  }
  const responseText = insights.length > 0
    ? insights[0] + '\n\n' + (insights.length > 1 ? insights.slice(1, 3).join('\n\n') : '')
    : 'Log some data across your dashboard and I\'ll have personalized advice for you!';
  return { response: responseText, insights };
}
