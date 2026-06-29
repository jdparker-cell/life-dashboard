'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import BentoCard from '@/components/BentoCard';
import Modal from '@/components/Modal';
import { useStore } from '@/lib/store';
import { today, calculateMacroProgress, generateCoachAdvice } from '@/lib/utils';
import { MealType, FoodEntry } from '@/lib/types';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function FoodPage() {
  return (
    <AppShell>
      <FoodDashboard />
    </AppShell>
  );
}

function FoodDashboard() {
  const { data, addFood, deleteFood } = useStore();
  const d = today();
  const [activeMeal, setActiveMeal] = useState<MealType>('breakfast');
  const [foodModal, setFoodModal] = useState(false);
  const [editFood, setEditFood] = useState<Partial<FoodEntry>>({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, mealType: 'breakfast', servingSize: '' });

  const todayFood = data.foodLogs.filter(f => f.date === d);
  const macroProgress = calculateMacroProgress(todayFood, data.profile.macroGoals);
  const coachAdvice = generateCoachAdvice(data, d);

  const filteredFood = todayFood.filter(f => f.mealType === activeMeal);
  const mealCounts = MEAL_TYPES.reduce((acc, m) => ({ ...acc, [m]: todayFood.filter(f => f.mealType === m).length }), {} as Record<string, number>);

  const handleAddFood = () => {
    if (!editFood.name?.trim()) return;
    addFood({
      name: editFood.name,
      calories: editFood.calories || 0,
      protein: editFood.protein || 0,
      carbs: editFood.carbs || 0,
      fat: editFood.fat || 0,
      mealType: (editFood.mealType || activeMeal) as MealType,
      date: d,
      servingSize: editFood.servingSize,
      notes: editFood.notes,
    });
    setEditFood({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, mealType: 'breakfast', servingSize: '' });
    setFoodModal(false);
  };

  return (
    <div className="space-y-4 pb-8">
      <h1 className="text-xl font-bold text-white">Food & Macros</h1>
      <p className="text-xs text-white/30 -mt-3">Manual tracking — no paid APIs required</p>

      {/* Coach card */}
      <BentoCard sectionLabel="Your Coach" glow="green">
        <div className="flex gap-4 items-start">
          <div className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center animate-float" style={{ background: 'radial-gradient(circle, rgba(99,240,173,0.25), transparent)' }}>
            <div className="w-8 h-8 rounded-full bg-[#63f0ad]/20" style={{ boxShadow: '0 0 20px rgba(99,240,173,0.2)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold text-white/70">Today&apos;s Fuel</span>
              <span className="text-lg font-bold text-[#63f0ad]">{coachAdvice.score}/10</span>
            </div>
            <div className="nova-pill">Today&apos;s Read</div>
            <p className="text-xs text-white/60 leading-relaxed">{coachAdvice.readout}{coachAdvice.tip}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setFoodModal(true)} className="btn-green flex-1 text-xs">Add Food</button>
          <button onClick={() => setFoodModal(true)} className="btn-ghost-green flex-1 text-xs">Snap a meal</button>
          <button onClick={() => { setActiveMeal('snack'); setFoodModal(true); }} className="btn-ghost-green flex-1 text-xs">Quick Drink</button>
          <button onClick={() => setFoodModal(true)} className="btn-ghost-green flex-1 text-xs">Scan</button>
        </div>
      </BentoCard>

      {/* Macro summary */}
      <BentoCard sectionLabel="Today's Fuel" glow="green">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Calories</div>
            <div className="text-lg font-bold text-white">{Math.round(macroProgress.calories)}</div>
            <div className="macro-bar-bg mt-1"><div className="macro-bar-fill" style={{ width: `${macroProgress.caloriesPct}%`, background: '#63f0ad' }} /></div>
            <div className="text-[8px] text-white/20 mt-0.5">{Math.round(macroProgress.calories)} / {data.profile.macroGoals.calories}</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Protein</div>
            <div className="text-lg font-bold text-[#63f0ad]">{Math.round(macroProgress.protein)}g</div>
            <div className="macro-bar-bg mt-1"><div className="macro-bar-fill" style={{ width: `${macroProgress.proteinPct}%`, background: '#63f0ad' }} /></div>
            <div className="text-[8px] text-white/20 mt-0.5">{Math.round(macroProgress.protein)} / {data.profile.macroGoals.protein}g</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Carbs</div>
            <div className="text-lg font-bold text-[#2dd4bf]">{Math.round(macroProgress.carbs)}g</div>
            <div className="macro-bar-bg mt-1"><div className="macro-bar-fill" style={{ width: `${macroProgress.carbsPct}%`, background: '#2dd4bf' }} /></div>
            <div className="text-[8px] text-white/20 mt-0.5">{Math.round(macroProgress.carbs)} / {data.profile.macroGoals.carbs}g</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Fat</div>
            <div className="text-lg font-bold text-[#f59e0b]">{Math.round(macroProgress.fat)}g</div>
            <div className="macro-bar-bg mt-1"><div className="macro-bar-fill" style={{ width: `${macroProgress.fatPct}%`, background: '#f59e0b' }} /></div>
            <div className="text-[8px] text-white/20 mt-0.5">{Math.round(macroProgress.fat)} / {data.profile.macroGoals.fat}g</div>
          </div>
        </div>
      </BentoCard>

      {/* Meal tabs + food list */}
      <BentoCard
        sectionLabel="Logged"
        action={<button onClick={() => setFoodModal(true)} className="text-[10px] text-[#63f0ad]">+ Add</button>}
        glow="green"
      >
        {/* Meal tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {MEAL_TYPES.map(m => (
            <button key={m} onClick={() => setActiveMeal(m)}
              className={`meal-tab capitalize ${activeMeal === m ? 'active' : ''}`}>
              {m}{mealCounts[m] > 0 ? ` (${mealCounts[m]})` : ''}
            </button>
          ))}
        </div>

        {/* Food list */}
        {filteredFood.length === 0 ? (
          <button onClick={() => setFoodModal(true)} className="w-full py-8 text-xs text-white/20 border border-dashed border-white/10 rounded-xl hover:border-white/20">
            + Add food to {activeMeal}
          </button>
        ) : (
          <div className="space-y-2">
            {filteredFood.map(f => (
              <div key={f.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{f.name}</span>
                  <span className="text-xs font-bold text-white/70 font-mono">{Math.round(f.calories)} kcal</span>
                </div>
                <div className="macro-bar-bg mb-2">
                  <div className="macro-bar-fill" style={{ width: '100%', background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <div className="flex gap-3 text-[10px] text-white/40">
                  <span style={{ color: '#63f0ad' }}>{Math.round(f.protein)}g protein</span>
                  <span style={{ color: '#2dd4bf' }}>{Math.round(f.carbs)}g carbs</span>
                  <span style={{ color: '#f59e0b' }}>{Math.round(f.fat)}g fat</span>
                </div>
                <button onClick={() => deleteFood(f.id)} className="text-[9px] text-red-400/40 hover:text-red-400 mt-2">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      {/* Add Food Modal */}
      <Modal open={foodModal} onClose={() => { setFoodModal(false); setEditFood({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, mealType: 'breakfast', servingSize: '' }); }} title="Add Food">
        <div className="space-y-3">
          <div>
            <label>Food Name</label>
            <input value={editFood.name} onChange={e => setEditFood(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Chicken breast" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Calories</label>
              <input type="number" value={editFood.calories || ''} onChange={e => setEditFood(p => ({ ...p, calories: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label>Protein (g)</label>
              <input type="number" value={editFood.protein || ''} onChange={e => setEditFood(p => ({ ...p, protein: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Carbs (g)</label>
              <input type="number" value={editFood.carbs || ''} onChange={e => setEditFood(p => ({ ...p, carbs: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label>Fat (g)</label>
              <input type="number" value={editFood.fat || ''} onChange={e => setEditFood(p => ({ ...p, fat: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label>Meal Type</label>
            <select value={editFood.mealType || activeMeal} onChange={e => setEditFood(p => ({ ...p, mealType: e.target.value as MealType }))}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div>
            <label>Serving Size (optional)</label>
            <input value={editFood.servingSize || ''} onChange={e => setEditFood(p => ({ ...p, servingSize: e.target.value }))} placeholder="e.g. 150g, 1 cup" />
          </div>
          <div>
            <label>Notes (optional)</label>
            <textarea value={editFood.notes || ''} onChange={e => setEditFood(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <button onClick={handleAddFood} className="btn-primary w-full">Add Food</button>
        </div>
      </Modal>
    </div>
  );
}
