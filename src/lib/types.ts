export type Currency = 'USD' | 'AUD' | 'EUR' | 'GBP' | 'CHF' | 'CAD' | 'NZD' | 'JPY';
export type WeightUnit = 'kg' | 'lb';
export type WaterUnit = 'mL' | 'oz';
export type Theme = 'dark' | 'light';

export interface UserProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
  weightUnit: WeightUnit;
  timezone: string;
  bedtimeGoal: string;
  wakeTimeGoal: string;
  dashboardTitle: string;
  accentColor: string;
  dayTrackerStart: string;
  dayTrackerEnd: string;
  waterUnit: WaterUnit;
  bottleSize: number;
  activityHours: number;
  caffeineSensitivity: 'low' | 'normal' | 'high';
  sleepGoal: number;
  currency: Currency;
  currencySymbol: string;
  netWorthGoal?: number;
  macroGoals: MacroGoals;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  category: 'school' | 'gym' | 'health' | 'finance' | 'personal' | 'work' | 'other';
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
  pushedFrom?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string;
  timeBlock?: string;
  priority: 'low' | 'medium' | 'high';
  category: Goal['category'];
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface Supplement {
  id: string;
  name: string;
  dose: string;
  unit: string;
  schedule: 'morning' | 'lunch' | 'evening' | 'anytime';
  windowStart?: string;
  windowEnd?: string;
  notes?: string;
  runningLow: boolean;
  stockCount?: number;
  isCustom: boolean;
  createdAt: string;
}

export interface SupplementLog {
  id: string;
  supplementId: string;
  date: string;
  taken: boolean;
  time?: string;
}

export interface WaterLog {
  id: string;
  date: string;
  amount: number;
  unit: WaterUnit;
  timestamp: string;
}

export interface SleepLog {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  duration: number;
  quality: number;
  notes?: string;
  isNap: boolean;
  createdAt: string;
}

export interface CaffeineLog {
  id: string;
  date: string;
  drinkName: string;
  caffeineMg: number;
  servingSize: string;
  timestamp: string;
  isCustom: boolean;
}

export interface ReadinessLog {
  id: string;
  date: string;
  sleepDuration: number;
  sleepQuality: number;
  caffeineMg: number;
  waterProgress: number;
  soreness: number;
  mood: number;
  stress: number;
  energy: number;
  focus: number;
  state: 'foggy' | 'sharp' | 'tired' | 'focused';
  notes?: string;
  createdAt: string;
}

export interface GymLocation {
  id: string;
  name: string;
}

export type WorkoutSplitDay = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'rest' | 'custom';

export interface WorkoutSplit {
  id: string;
  day: WorkoutSplitDay;
  name: string;
  order: number;
}

export interface Exercise {
  id: string;
  name: string;
  locationId?: string;
  startingWeight: number;
  weightUnit: WeightUnit;
  repRangeMin: number;
  repRangeMax: number;
  increment: number;
  notes?: string;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  sessionId: string;
  weight: number;
  reps: number;
  rpe?: number;
  notes?: string;
  createdAt: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  splitDay: WorkoutSplitDay;
  splitName: string;
  locationId?: string;
  completed: boolean;
  duration?: number;
  notes?: string;
  createdAt: string;
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  unit: WeightUnit;
  notes?: string;
  createdAt: string;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  imageData: string;
  bodyWeight?: number;
  notes?: string;
  createdAt: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  balance: number;
  currency: Currency;
  type: 'checking' | 'savings' | 'cash' | 'investment' | 'other';
  includeInNetWorth: boolean;
  createdAt: string;
}

export interface InvestmentHolding {
  id: string;
  accountId?: string;
  name: string;
  ticker?: string;
  shares: number;
  manualPrice: number;
  notes?: string;
  createdAt: string;
}

export interface CryptoHolding {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  manualPrice: number;
  createdAt: string;
}

export interface OtherAsset {
  id: string;
  name: string;
  value: number;
  notes?: string;
  includeInNetWorth: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  renewalDate: string;
  frequency: 'monthly' | 'yearly' | 'weekly' | 'custom';
  accountId?: string;
  autoDeduct: boolean;
  notes?: string;
  category: string;
  cancelled: boolean;
  usage: 'often' | 'sometimes' | 'rarely' | 'not-used';
  createdAt: string;
}

export interface Order {
  id: string;
  itemName: string;
  price: number;
  dateBought: string;
  expectedDelivery?: string;
  accountId?: string;
  status: 'ordered' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  deductFromAccount: boolean;
  notes?: string;
  receiptImage?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  accountId?: string;
  notes?: string;
  imageData?: string;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  link?: string;
  purchased: boolean;
  createdAt: string;
}

export interface IncomeLog {
  id: string;
  source: string;
  amount: number;
  date: string;
  accountId?: string;
  recurring: boolean;
  frequency?: 'weekly' | 'monthly' | 'yearly' | 'one-time';
  createdAt: string;
}

export interface NetWorthSnapshot {
  id: string;
  date: string;
  totalNetWorth: number;
  accounts: number;
  investments: number;
  crypto: number;
  assets: number;
  createdAt: string;
}

export interface MentorSettings {
  avatarStyle: 'orb' | 'robot' | 'pixel' | 'plasma' | 'minimal';
  accentColor: string;
  enableBlinking: boolean;
  enableIdleSleep: boolean;
  enableReminders: boolean;
  chatCompact: boolean;
  showOnMain: boolean;
  showOnGym: boolean;
  showOnFinance: boolean;
  showOnHealth: boolean;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: MealType;
  date: string;
  servingSize?: string;
  notes?: string;
  createdAt: string;
}

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AppData {
  profile: UserProfile;
  goals: Goal[];
  tasks: Task[];
  foodLogs: FoodEntry[];
  supplements: Supplement[];
  supplementLogs: SupplementLog[];
  waterLogs: WaterLog[];
  sleepLogs: SleepLog[];
  caffeineLogs: CaffeineLog[];
  readinessLogs: ReadinessLog[];
  gymLocations: GymLocation[];
  workoutSplits: WorkoutSplit[];
  exercises: Exercise[];
  workoutSessions: WorkoutSession[];
  workoutSets: WorkoutSet[];
  weightLogs: WeightLog[];
  progressPhotos: ProgressPhoto[];
  accounts: FinanceAccount[];
  investments: InvestmentHolding[];
  cryptoHoldings: CryptoHolding[];
  otherAssets: OtherAsset[];
  subscriptions: Subscription[];
  orders: Order[];
  receipts: Receipt[];
  wishlistItems: WishlistItem[];
  incomeLogs: IncomeLog[];
  netWorthSnapshots: NetWorthSnapshot[];
  mentorSettings: MentorSettings;
  onboardingComplete: boolean;
  demoDataLoaded: boolean;
}
