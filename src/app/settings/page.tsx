'use client';

import { useState, useRef } from 'react';
import AppShell from '@/components/AppShell';
import BentoCard from '@/components/BentoCard';
import Modal from '@/components/Modal';
import { useStore } from '@/lib/store';
import { hasSupabase } from '@/lib/supabase';

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsDashboard />
    </AppShell>
  );
}

function SettingsDashboard() {
  const { data, updateProfile, updateMentorSettings, updateMacroGoals, loadDemo, resetAll, exportData, importData, syncPassphrase, setSyncPassphrase, clearSyncPassphrase, cloudStatus } = useStore();
  const [passphraseInput, setPassphraseInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const success = importData(text);
      setImportStatus(success ? '✅ Data imported successfully' : '❌ Invalid file format');
      setTimeout(() => setImportStatus(''), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 pb-8">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      {/* Profile */}
      <BentoCard title="Profile">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Name</label>
              <input value={data.profile.name} onChange={e => updateProfile({ name: e.target.value })} />
            </div>
            <div>
              <label>Age</label>
              <input type="number" value={data.profile.age} onChange={e => updateProfile({ age: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Height (cm)</label>
              <input type="number" value={data.profile.height} onChange={e => updateProfile({ height: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label>Weight ({data.profile.weightUnit})</label>
              <input type="number" value={data.profile.weight} step="0.1" onChange={e => updateProfile({ weight: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={data.profile.weightUnit === 'kg'} onChange={() => updateProfile({ weightUnit: 'kg' })} />
              <span className="text-sm text-white/60">Metric (kg)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={data.profile.weightUnit === 'lb'} onChange={() => updateProfile({ weightUnit: 'lb' })} />
              <span className="text-sm text-white/60">Imperial (lb)</span>
            </label>
          </div>
        </div>
      </BentoCard>

      {/* Dashboard */}
      <BentoCard title="Dashboard">
        <div className="space-y-3">
          <div>
            <label>Dashboard Title</label>
            <input value={data.profile.dashboardTitle} onChange={e => updateProfile({ dashboardTitle: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Day Start Time</label>
              <input type="time" value={data.profile.dayTrackerStart} onChange={e => updateProfile({ dayTrackerStart: e.target.value })} />
            </div>
            <div>
              <label>Day End Time</label>
              <input type="time" value={data.profile.dayTrackerEnd} onChange={e => updateProfile({ dayTrackerEnd: e.target.value })} />
            </div>
          </div>
          <div>
            <label>Timezone</label>
            <input value={data.profile.timezone} onChange={e => updateProfile({ timezone: e.target.value })} />
          </div>
        </div>
      </BentoCard>

      {/* Macro Goals */}
      <BentoCard title="Macro Goals">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Daily Calories</label>
              <input type="number" value={data.profile.macroGoals.calories} onChange={e => updateMacroGoals({ calories: parseInt(e.target.value) || 2500 })} />
            </div>
            <div>
              <label>Protein (g)</label>
              <input type="number" value={data.profile.macroGoals.protein} onChange={e => updateMacroGoals({ protein: parseInt(e.target.value) || 180 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Carbs (g)</label>
              <input type="number" value={data.profile.macroGoals.carbs} onChange={e => updateMacroGoals({ carbs: parseInt(e.target.value) || 250 })} />
            </div>
            <div>
              <label>Fat (g)</label>
              <input type="number" value={data.profile.macroGoals.fat} onChange={e => updateMacroGoals({ fat: parseInt(e.target.value) || 70 })} />
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Health */}
      <BentoCard title="Health Settings">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Sleep Goal (hours)</label>
              <input type="number" value={data.profile.sleepGoal} step="0.5" onChange={e => updateProfile({ sleepGoal: parseFloat(e.target.value) || 8 })} />
            </div>
            <div>
              <label>Caffeine Sensitivity</label>
              <select value={data.profile.caffeineSensitivity} onChange={e => updateProfile({ caffeineSensitivity: e.target.value as any })}>
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Bedtime Goal</label>
              <input type="time" value={data.profile.bedtimeGoal} onChange={e => updateProfile({ bedtimeGoal: e.target.value })} />
            </div>
            <div>
              <label>Wake Time Goal</label>
              <input type="time" value={data.profile.wakeTimeGoal} onChange={e => updateProfile({ wakeTimeGoal: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Bottle Size (mL)</label>
              <input type="number" value={data.profile.bottleSize} onChange={e => updateProfile({ bottleSize: parseInt(e.target.value) || 250 })} />
            </div>
            <div>
              <label>Activity (hours/week)</label>
              <input type="number" value={data.profile.activityHours} onChange={e => updateProfile({ activityHours: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Gym */}
      <BentoCard title="Gym Settings">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Weight Unit</label>
              <select value={data.profile.weightUnit} onChange={e => updateProfile({ weightUnit: e.target.value as any })}>
                <option value="kg">kg</option><option value="lb">lb</option>
              </select>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Finance */}
      <BentoCard title="Finance Settings">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Currency</label>
              <select value={data.profile.currency} onChange={e => updateProfile({ currency: e.target.value as any })}>
                <option value="USD">USD $</option><option value="AUD">AUD $</option><option value="EUR">EUR €</option>
                <option value="GBP">GBP £</option><option value="CHF">CHF</option><option value="CAD">CAD $</option>
                <option value="NZD">NZD $</option><option value="JPY">JPY ¥</option>
              </select>
            </div>
            <div>
              <label>Currency Symbol</label>
              <input value={data.profile.currencySymbol} onChange={e => updateProfile({ currencySymbol: e.target.value })} placeholder="$" />
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Cloud Sync */}
      <BentoCard title="Cloud Sync">
        <div className="space-y-3">
          {!hasSupabase && (
            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20">
              <div className="text-xs text-amber-400/80">
                Supabase not configured. Set <code className="text-white/60">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                <code className="text-white/60">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> as Vercel environment variables to enable cloud sync.
              </div>
            </div>
          )}

          {hasSupabase && (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className={`w-2 h-2 rounded-full ${cloudStatus === 'synced' ? 'bg-emerald-400' : cloudStatus === 'error' ? 'bg-red-400' : cloudStatus === 'syncing' ? 'bg-yellow-400' : 'bg-amber-400'}`} />
                <div>
                  <div className="text-sm text-white">
                    {cloudStatus === 'synced' ? 'Synced to Cloud' :
                     cloudStatus === 'syncing' ? 'Syncing...' :
                     cloudStatus === 'error' ? 'Sync Error' :
                     syncPassphrase ? 'Ready to Sync' : 'Cloud Disconnected'}
                  </div>
                  <div className="text-xs text-white/40">
                    {cloudStatus === 'synced' ? 'All changes are synced across devices.' :
                     cloudStatus === 'syncing' ? 'Saving changes to the cloud...' :
                     cloudStatus === 'error' ? 'Failed to sync. Check your connection.' :
                     syncPassphrase ? 'Enter your passphrase to enable sync.' :
                     'Set a sync passphrase to share data between devices.'}
                  </div>
                </div>
              </div>

              {syncPassphrase ? (
                <div className="space-y-2">
                  <div className="text-xs text-white/40">Connected with passphrase</div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={passphraseInput}
                      onChange={e => setPassphraseInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && passphraseInput) { setSyncPassphrase(passphraseInput); setPassphraseInput(''); } }}
                      placeholder="Change passphrase..."
                      className="flex-1"
                    />
                    <button
                      onClick={() => { setSyncPassphrase(passphraseInput); setPassphraseInput(''); }}
                      disabled={!passphraseInput}
                      className="btn-secondary text-xs"
                    >
                      Update
                    </button>
                  </div>
                  <button onClick={clearSyncPassphrase} className="btn-danger text-xs">Disconnect Cloud Sync</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-white/40">Set a passphrase to sync across your devices. Use the same passphrase on each device.</div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={passphraseInput}
                      onChange={e => setPassphraseInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && passphraseInput) { setSyncPassphrase(passphraseInput); setPassphraseInput(''); } }}
                      placeholder="Enter sync passphrase..."
                      className="flex-1"
                    />
                    <button
                      onClick={() => { setSyncPassphrase(passphraseInput); setPassphraseInput(''); }}
                      disabled={!passphraseInput}
                      className="btn-primary text-xs"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </BentoCard>

      {/* Backup */}
      <BentoCard title="Backup">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExport} className="btn-secondary text-xs">Export Backup</button>
            <button onClick={handleImport} className="btn-secondary text-xs">Import Backup</button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </div>
          {importStatus && <div className="text-xs text-white/60">{importStatus}</div>}
        </div>
      </BentoCard>

      {/* Data Management */}
      <BentoCard title="Data Management">
        <div className="space-y-3">
          <button onClick={() => setShowDemoModal(true)} className="btn-secondary w-full text-left">Load Demo Data</button>
          <button onClick={() => setShowResetModal(true)} className="btn-danger w-full text-left">Reset All Data</button>
        </div>
      </BentoCard>

      {/* PWA Info */}
      <BentoCard title="PWA">
        <div className="space-y-2 text-xs text-white/50">
          <p>📱 This app can be installed on your phone's home screen.</p>
          <p>On iPhone: Tap Share → Add to Home Screen.</p>
          <p>On Android: Tap Menu → Install App.</p>
          <p>Once installed, it works like a native app with bottom navigation.</p>
        </div>
      </BentoCard>

      {/* Disclaimer */}
      <div className="text-[10px] text-white/20 leading-relaxed pb-8">
        <p>Health tracking is for personal logging only, not medical advice. Always consult a healthcare professional.</p>
        <p>Finance tracking is for personal tracking only, not financial advice.</p>
        <p>Body composition estimates are based on logged trends and may be inaccurate.</p>
        <p>This app does not provide medical, financial, or professional advice of any kind.</p>
        <p className="mt-2">Built with ❤️ for personal use.</p>
      </div>

      <Modal open={showResetModal} onClose={() => setShowResetModal(false)} title="Reset All Data?">
        <div className="space-y-4">
          <p className="text-sm text-white/60">This will permanently delete all your data. Make sure to export a backup first if you want to keep it.</p>
          <button onClick={() => { resetAll(); setShowResetModal(false); }} className="btn-danger w-full">Yes, Reset Everything</button>
          <button onClick={() => setShowResetModal(false)} className="btn-secondary w-full">Cancel</button>
        </div>
      </Modal>

      <Modal open={showDemoModal} onClose={() => setShowDemoModal(false)} title="Load Demo Data?">
        <div className="space-y-4">
          <p className="text-sm text-white/60">This will replace all your current data with demo data. It's useful for testing but will overwrite your existing entries.</p>
          <p className="text-xs text-amber-400/80">Demo data is fictional and for demonstration purposes only.</p>
          <button onClick={() => { loadDemo(); setShowDemoModal(false); }} className="btn-primary w-full">Load Demo Data</button>
          <button onClick={() => setShowDemoModal(false)} className="btn-secondary w-full">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
