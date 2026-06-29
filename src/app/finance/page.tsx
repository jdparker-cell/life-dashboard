'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import BentoCard from '@/components/BentoCard';
import Modal from '@/components/Modal';
import ProgressBar from '@/components/ProgressBar';
import { useStore } from '@/lib/store';
import { today, calculateNetWorth, formatCurrency, calculateSubscriptionTotals, calculateWishlistAffordability, daysUntil, getAffordabilityColor, generateId } from '@/lib/utils';
import { Subscription, WishlistItem, Order, FinanceAccount } from '@/lib/types';

export default function FinancePage() {
  return (
    <AppShell>
      <FinanceDashboard />
    </AppShell>
  );
}

function FinanceDashboard() {
  const { data, addAccount, updateAccount, deleteAccount, addInvestment, deleteInvestment, addCrypto, deleteCrypto, addAsset, deleteAsset, addSubscription, updateSubscription, deleteSubscription, addOrder, updateOrder, deleteOrder, addReceipt, deleteReceipt, addWishlistItem, updateWishlistItem, deleteWishlistItem, purchaseWishlistItem, addIncome, deleteIncome, takeSnapshot } = useStore();
  const d = today();
  const netWorth = calculateNetWorth(data);
  const subs = calculateSubscriptionTotals(data.subscriptions);
  const [tab, setTab] = useState<'overview' | 'accounts' | 'subscriptions' | 'orders' | 'wishlist' | 'income'>('overview');

  const [accountModal, setAccountModal] = useState(false);
  const [subModal, setSubModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [wishlistModal, setWishlistModal] = useState(false);
  const [incomeModal, setIncomeModal] = useState(false);
  const [investmentModal, setInvestmentModal] = useState(false);
  const [cryptoModal, setCryptoModal] = useState(false);
  const [assetModal, setAssetModal] = useState(false);

  const [newAccount, setNewAccount] = useState({ name: '', balance: 0, currency: 'USD' as const, type: 'checking' as FinanceAccount['type'], includeInNetWorth: true });
  const [newSub, setNewSub] = useState({ name: '', amount: 0, renewalDate: d, frequency: 'monthly' as Subscription['frequency'], accountId: '', autoDeduct: false, category: '', usage: 'sometimes' as Subscription['usage'], notes: '' });
  const [newOrder, setNewOrder] = useState({ itemName: '', price: 0, dateBought: d, expectedDelivery: '', accountId: '', status: 'ordered' as Order['status'], deductFromAccount: false, notes: '' });
  const [newWishlist, setNewWishlist] = useState({ name: '', price: 0, category: '', priority: 'medium' as WishlistItem['priority'], notes: '', link: '' });
  const [newIncome, setNewIncome] = useState({ source: '', amount: 0, date: d, accountId: '', recurring: false, frequency: 'monthly' as 'weekly' | 'monthly' | 'yearly' | 'one-time' });
  const [newInvestment, setNewInvestment] = useState({ name: '', ticker: '', shares: 1, manualPrice: 0, accountId: '', notes: '' });
  const [newCrypto, setNewCrypto] = useState({ name: '', symbol: '', amount: 0, manualPrice: 0 });
  const [newAsset, setNewAsset] = useState({ name: '', value: 0, notes: '', includeInNetWorth: true });

  const handleAddAccount = () => {
    if (!newAccount.name.trim()) return;
    addAccount({ ...newAccount, currency: newAccount.currency as any });
    setNewAccount({ name: '', balance: 0, currency: 'USD', type: 'checking', includeInNetWorth: true });
    setAccountModal(false);
  };

  const handleAddSub = () => {
    if (!newSub.name.trim()) return;
    addSubscription({ ...newSub, accountId: newSub.accountId || undefined, cancelled: false });
    setNewSub({ name: '', amount: 0, renewalDate: d, frequency: 'monthly', accountId: '', autoDeduct: false, category: '', usage: 'sometimes', notes: '' });
    setSubModal(false);
  };

  const handleAddOrder = () => {
    if (!newOrder.itemName.trim()) return;
    addOrder({ ...newOrder, accountId: newOrder.accountId || undefined, expectedDelivery: newOrder.expectedDelivery || undefined });
    setNewOrder({ itemName: '', price: 0, dateBought: d, expectedDelivery: '', accountId: '', status: 'ordered', deductFromAccount: false, notes: '' });
    setOrderModal(false);
  };

  const handleAddWishlist = () => {
    if (!newWishlist.name.trim()) return;
    addWishlistItem({ ...newWishlist, link: newWishlist.link || undefined, purchased: false });
    setNewWishlist({ name: '', price: 0, category: '', priority: 'medium', notes: '', link: '' });
    setWishlistModal(false);
  };

  const handleAddIncome = () => {
    if (!newIncome.source.trim()) return;
    addIncome({ ...newIncome, accountId: newIncome.accountId || undefined, frequency: newIncome.recurring ? newIncome.frequency : 'one-time' });
    setNewIncome({ source: '', amount: 0, date: d, accountId: '', recurring: false, frequency: 'monthly' });
    setIncomeModal(false);
  };

  const handleAddInvestment = () => {
    if (!newInvestment.name.trim()) return;
    addInvestment({ ...newInvestment, accountId: newInvestment.accountId || undefined });
    setNewInvestment({ name: '', ticker: '', shares: 1, manualPrice: 0, accountId: '', notes: '' });
    setInvestmentModal(false);
  };

  const handleAddCrypto = () => {
    if (!newCrypto.name.trim()) return;
    addCrypto(newCrypto);
    setNewCrypto({ name: '', symbol: '', amount: 0, manualPrice: 0 });
    setCryptoModal(false);
  };

  const handleAddAsset = () => {
    if (!newAsset.name.trim()) return;
    addAsset(newAsset);
    setNewAsset({ name: '', value: 0, notes: '', includeInNetWorth: true });
    setAssetModal(false);
  };

  const monthlyIncome = data.incomeLogs.filter(i => i.recurring).reduce((s, i) => {
    if (i.frequency === 'monthly') return s + i.amount;
    if (i.frequency === 'yearly') return s + i.amount / 12;
    if (i.frequency === 'weekly') return s + i.amount * 4.33;
    return s;
  }, 0);

  const totalInvestments = data.investments.reduce((s, i) => s + i.shares * i.manualPrice, 0);
  const totalCrypto = data.cryptoHoldings.reduce((s, c) => s + c.amount * c.manualPrice, 0);
  const totalAssets = data.otherAssets.filter(a => a.includeInNetWorth).reduce((s, a) => s + a.value, 0);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'subscriptions', label: 'Subs' },
    { id: 'orders', label: 'Orders' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'income', label: 'Income' },
  ] as const;

  return (
    <div className="space-y-4 pb-8">
      <h1 className="text-xl font-bold text-white">Finance</h1>
      <p className="text-xs text-white/30 -mt-3">Personal tracking only, not financial advice</p>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            tab === t.id ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/40 hover:text-white/60'
          }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <BentoCard title="Net Worth">
            <div className="text-center py-4">
              <div className="text-sm text-white/40">Total Net Worth</div>
              <div className={`text-4xl font-bold mt-1 ${netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(netWorth, data.profile.currencySymbol || '$')}
              </div>
              <div className="text-xs text-white/30 mt-1">1% = {formatCurrency(calculateNetWorth(data) / 100, data.profile.currencySymbol || '$')}</div>
            </div>

            {/* Simple pie-like bar */}
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-white/60">Accounts</span>
                <span className="ml-auto text-white">{formatCurrency(data.accounts.filter(a => a.includeInNetWorth).reduce((s, a) => s + a.balance, 0), data.profile.currencySymbol || '$')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-white/60">Investments</span>
                <span className="ml-auto text-white">{formatCurrency(totalInvestments, data.profile.currencySymbol || '$')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-white/60">Crypto</span>
                <span className="ml-auto text-white">{formatCurrency(totalCrypto, data.profile.currencySymbol || '$')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white/60">Assets</span>
                <span className="ml-auto text-white">{formatCurrency(totalAssets, data.profile.currencySymbol || '$')}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={takeSnapshot} className="btn-secondary flex-1 text-xs">Take Snapshot</button>
            </div>

            {data.netWorthSnapshots.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-xs text-white/40 mb-2">Snapshots</div>
                {data.netWorthSnapshots.slice(-5).reverse().map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-white/40">{s.date}</span>
                    <span className="text-white">{formatCurrency(s.totalNetWorth, data.profile.currencySymbol || '$')}</span>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>

          <div className="grid grid-cols-2 gap-3">
            <BentoCard title="Subscriptions" compact>
              <div className="text-sm font-medium text-purple-400">{formatCurrency(subs.monthly, data.profile.currencySymbol || '$')}/mo</div>
              <div className="text-xs text-white/40">{formatCurrency(subs.yearly, data.profile.currencySymbol || '$')}/yr</div>
            </BentoCard>
            <BentoCard title="Income" compact>
              <div className="text-sm font-medium text-emerald-400">{formatCurrency(monthlyIncome, data.profile.currencySymbol || '$')}/mo</div>
              <div className="text-xs text-white/40">{data.incomeLogs.length} entries</div>
            </BentoCard>
          </div>
        </>
      )}

      {tab === 'accounts' && (
        <>
          <BentoCard
            title="Accounts"
            action={<button onClick={() => setAccountModal(true)} className="text-xs text-cyan-400">+ Add</button>}
          >
            {data.accounts.length === 0 ? (
              <div className="py-6 text-center text-sm text-white/30">No accounts added yet</div>
            ) : (
              <div className="space-y-2">
                {data.accounts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <div className="text-sm text-white">{a.name}</div>
                      <div className="text-xs text-white/40 capitalize">{a.type}{!a.includeInNetWorth && ' · Excluded'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{formatCurrency(a.balance, data.profile.currencySymbol || '$')}</span>
                      <button onClick={() => deleteAccount(a.id)} className="text-red-400/50 hover:text-red-400"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>

          <BentoCard
            title="Investments"
            action={<button onClick={() => setInvestmentModal(true)} className="text-xs text-cyan-400">+ Add</button>}
          >
            {data.investments.length === 0 ? (
              <div className="py-3 text-center text-xs text-white/30">No investments</div>
            ) : (
              <div className="space-y-2">
                {data.investments.map(i => (
                  <div key={i.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                    <div>
                      <div className="text-sm text-white">{i.name}</div>
                      <div className="text-xs text-white/40">{i.ticker && `${i.ticker} · `}{i.shares} shares @ {formatCurrency(i.manualPrice, data.profile.currencySymbol || '$')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{formatCurrency(i.shares * i.manualPrice, data.profile.currencySymbol || '$')}</span>
                      <button onClick={() => deleteInvestment(i.id)} className="text-red-400/50"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>

          <BentoCard
            title="Crypto"
            action={<button onClick={() => setCryptoModal(true)} className="text-xs text-cyan-400">+ Add</button>}
          >
            {data.cryptoHoldings.length === 0 ? (
              <div className="py-3 text-center text-xs text-white/30">No crypto tracked</div>
            ) : (
              <div className="space-y-2">
                {data.cryptoHoldings.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                    <div>
                      <div className="text-sm text-white">{c.name}</div>
                      <div className="text-xs text-white/40">{c.amount} {c.symbol} @ {formatCurrency(c.manualPrice, data.profile.currencySymbol || '$')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{formatCurrency(c.amount * c.manualPrice, data.profile.currencySymbol || '$')}</span>
                      <button onClick={() => deleteCrypto(c.id)} className="text-red-400/50"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>

          <BentoCard
            title="Other Assets"
            action={<button onClick={() => setAssetModal(true)} className="text-xs text-cyan-400">+ Add</button>}
          >
            {data.otherAssets.length === 0 ? (
              <div className="py-3 text-center text-xs text-white/30">No assets added</div>
            ) : (
              <div className="space-y-2">
                {data.otherAssets.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                    <div>
                      <div className="text-sm text-white">{a.name}</div>
                      {a.notes && <div className="text-xs text-white/30">{a.notes}</div>}
                    </div>
                    <span className="text-sm font-medium text-white">{formatCurrency(a.value, data.profile.currencySymbol || '$')}</span>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>

          <Modal open={accountModal} onClose={() => setAccountModal(false)} title="Add Account">
            <div className="space-y-3">
              <div><label>Account Name</label><input value={newAccount.name} onChange={e => setNewAccount(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Star One" /></div>
              <div><label>Balance</label><input type="number" value={newAccount.balance} onChange={e => setNewAccount(p => ({ ...p, balance: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label>Type</label><select value={newAccount.type} onChange={e => setNewAccount(p => ({ ...p, type: e.target.value as any }))}><option value="checking">Checking</option><option value="savings">Savings</option><option value="cash">Cash</option><option value="investment">Investment</option><option value="other">Other</option></select></div>
                <div><label>Currency</label><select value={newAccount.currency} onChange={e => setNewAccount(p => ({ ...p, currency: e.target.value as any }))}><option value="USD">USD</option><option value="AUD">AUD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="CHF">CHF</option><option value="CAD">CAD</option><option value="NZD">NZD</option><option value="JPY">JPY</option></select></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newAccount.includeInNetWorth} onChange={e => setNewAccount(p => ({ ...p, includeInNetWorth: e.target.checked }))} /><span className="text-sm text-white/60">Include in net worth</span></label>
              <button onClick={handleAddAccount} className="btn-primary w-full">Add Account</button>
            </div>
          </Modal>

          <Modal open={investmentModal} onClose={() => setInvestmentModal(false)} title="Add Investment">
            <div className="space-y-3">
              <div><label>Name</label><input value={newInvestment.name} onChange={e => setNewInvestment(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Vanguard ETF" /></div>
              <div><label>Ticker (optional)</label><input value={newInvestment.ticker} onChange={e => setNewInvestment(p => ({ ...p, ticker: e.target.value }))} placeholder="e.g. VOO" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label>Shares</label><input type="number" value={newInvestment.shares} onChange={e => setNewInvestment(p => ({ ...p, shares: parseFloat(e.target.value) || 0 }))} /></div><div><label>Manual Price</label><input type="number" value={newInvestment.manualPrice} onChange={e => setNewInvestment(p => ({ ...p, manualPrice: parseFloat(e.target.value) || 0 }))} /></div></div>
              <div><label>Account (optional)</label><select value={newInvestment.accountId} onChange={e => setNewInvestment(p => ({ ...p, accountId: e.target.value }))}><option value="">None</option>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              <button onClick={handleAddInvestment} className="btn-primary w-full">Add Investment</button>
            </div>
          </Modal>

          <Modal open={cryptoModal} onClose={() => setCryptoModal(false)} title="Add Crypto">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3"><div><label>Name</label><input value={newCrypto.name} onChange={e => setNewCrypto(p => ({ ...p, name: e.target.value }))} placeholder="Bitcoin" /></div><div><label>Symbol</label><input value={newCrypto.symbol} onChange={e => setNewCrypto(p => ({ ...p, symbol: e.target.value }))} placeholder="BTC" /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><label>Amount</label><input type="number" value={newCrypto.amount} onChange={e => setNewCrypto(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></div><div><label>Manual Price</label><input type="number" value={newCrypto.manualPrice} onChange={e => setNewCrypto(p => ({ ...p, manualPrice: parseFloat(e.target.value) || 0 }))} /></div></div>
              <button onClick={handleAddCrypto} className="btn-primary w-full">Add Crypto</button>
            </div>
          </Modal>

          <Modal open={assetModal} onClose={() => setAssetModal(false)} title="Add Asset">
            <div className="space-y-3">
              <div><label>Asset Name</label><input value={newAsset.name} onChange={e => setNewAsset(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Car" /></div>
              <div><label>Value</label><input type="number" value={newAsset.value} onChange={e => setNewAsset(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))} /></div>
              <div><label>Notes (optional)</label><textarea value={newAsset.notes} onChange={e => setNewAsset(p => ({ ...p, notes: e.target.value }))} /></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newAsset.includeInNetWorth} onChange={e => setNewAsset(p => ({ ...p, includeInNetWorth: e.target.checked }))} /><span className="text-sm text-white/60">Include in net worth</span></label>
              <button onClick={handleAddAsset} className="btn-primary w-full">Add Asset</button>
            </div>
          </Modal>
        </>
      )}

      {tab === 'subscriptions' && (
        <BentoCard
          title="Subscriptions"
          subtitle={`${formatCurrency(subs.monthly, data.profile.currencySymbol || '$')}/mo · ${formatCurrency(subs.yearly, data.profile.currencySymbol || '$')}/yr`}
          action={<button onClick={() => setSubModal(true)} className="text-xs text-cyan-400">+ Add</button>}
        >
          {data.subscriptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-white/30">No subscriptions tracked</div>
          ) : (
            <div className="space-y-2">
              {data.subscriptions.filter(s => !s.cancelled).map(s => {
                const dUntil = daysUntil(s.renewalDate);
                return (
                  <div key={s.id} className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white">{s.name}</div>
                        <div className="text-xs text-white/40">{s.category} · {s.usage.replace('-', ' ')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{formatCurrency(s.amount, data.profile.currencySymbol || '$')}</div>
                        <div className={`text-[10px] ${dUntil >= 0 && dUntil <= 5 ? 'text-red-400' : 'text-white/40'}`}>
                          {dUntil >= 0 ? `${dUntil}d` : 'Due today'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateSubscription(s.id, { cancelled: true })} className="text-[10px] text-red-400/60 hover:text-red-400">Cancel</button>
                      <button onClick={() => deleteSubscription(s.id)} className="text-[10px] text-white/30 hover:text-white">Delete</button>
                    </div>
                  </div>
                );
              })}
              {data.subscriptions.filter(s => s.cancelled).length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-white/30 cursor-pointer">Cancelled ({data.subscriptions.filter(s => s.cancelled).length})</summary>
                  <div className="space-y-2 mt-2">
                    {data.subscriptions.filter(s => s.cancelled).map(s => (
                      <div key={s.id} className="p-2 rounded-xl bg-white/5 opacity-50">
                        <div className="flex justify-between text-xs"><span className="text-white/60">{s.name}</span><span className="text-white/40">{formatCurrency(s.amount, data.profile.currencySymbol || '$')}</span></div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </BentoCard>
      )}

      {tab === 'orders' && (
        <BentoCard
          title="Orders"
          action={<button onClick={() => setOrderModal(true)} className="text-xs text-cyan-400">+ Add</button>}
        >
          {data.orders.length === 0 ? (
            <div className="py-6 text-center text-sm text-white/30">No orders tracked</div>
          ) : (
            <div className="space-y-2">
              {data.orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map(o => {
                const dUntil = o.expectedDelivery ? daysUntil(o.expectedDelivery) : null;
                return (
                  <div key={o.id} className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white">{o.itemName}</div>
                        <div className="text-xs text-white/40 capitalize">{o.status}{dUntil !== null ? ` · ${dUntil >= 0 ? `${dUntil}d` : 'delayed'}` : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{formatCurrency(o.price, data.profile.currencySymbol || '$')}</div>
                        <div className="text-[10px] text-white/40">{((o.price / (netWorth || 1)) * 100).toFixed(2)}% of NW</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateOrder(o.id, { status: 'delivered' })} className="text-[10px] text-emerald-400/60 hover:text-emerald-400">Delivered</button>
                      <button onClick={() => deleteOrder(o.id)} className="text-[10px] text-white/30 hover:text-white">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>
      )}

      {tab === 'wishlist' && (
        <BentoCard
          title="Wishlist"
          action={<button onClick={() => setWishlistModal(true)} className="text-xs text-cyan-400">+ Add</button>}
        >
          {data.wishlistItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-white/30">Nothing on your wishlist yet</div>
          ) : (
            <div className="space-y-2">
              {data.wishlistItems.filter(i => !i.purchased).map(item => {
                const afford = calculateWishlistAffordability(item, netWorth);
                return (
                  <div key={item.id} className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/40">{item.category && `${item.category} · `}{afford.percent}% of NW</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{formatCurrency(item.price, data.profile.currencySymbol || '$')}</div>
                        <div className="text-[10px]" style={{ color: getAffordabilityColor(afford.status) }}>{afford.status}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => purchaseWishlistItem(item.id)} className="text-[10px] text-emerald-400/60 hover:text-emerald-400">Mark purchased</button>
                      <button onClick={() => deleteWishlistItem(item.id)} className="text-[10px] text-white/30 hover:text-white">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>
      )}

      {tab === 'income' && (
        <BentoCard
          title="Income"
          subtitle={monthlyIncome > 0 ? `${formatCurrency(monthlyIncome, data.profile.currencySymbol || '$')}/mo recurring` : ''}
          action={<button onClick={() => setIncomeModal(true)} className="text-xs text-cyan-400">+ Add</button>}
        >
          {data.incomeLogs.length === 0 ? (
            <div className="py-6 text-center text-sm text-white/30">No income logged</div>
          ) : (
            <div className="space-y-2">
              {data.incomeLogs.slice().reverse().map(i => (
                <div key={i.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <div className="text-sm text-white">{i.source}</div>
                    <div className="text-xs text-white/40">{i.date}{i.recurring ? ` · ${i.frequency}` : ' · one-time'}</div>
                  </div>
                  <span className="text-sm font-medium text-emerald-400">+{formatCurrency(i.amount, data.profile.currencySymbol || '$')}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex justify-between text-xs text-white/40">
              <span>Total recurring/month</span>
              <span className="text-emerald-400 font-medium">{formatCurrency(monthlyIncome, data.profile.currencySymbol || '$')}</span>
            </div>
          </div>
        </BentoCard>
      )}

      <Modal open={subModal} onClose={() => setSubModal(false)} title="Add Subscription">
        <div className="space-y-3">
          <div><label>Name</label><input value={newSub.name} onChange={e => setNewSub(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Spotify" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label>Amount</label><input type="number" value={newSub.amount} onChange={e => setNewSub(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></div><div><label>Frequency</label><select value={newSub.frequency} onChange={e => setNewSub(p => ({ ...p, frequency: e.target.value as any }))}><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="weekly">Weekly</option><option value="custom">Custom</option></select></div></div>
          <div><label>Renewal Date</label><input type="date" value={newSub.renewalDate} onChange={e => setNewSub(p => ({ ...p, renewalDate: e.target.value }))} /></div>
          <div><label>Category</label><input value={newSub.category} onChange={e => setNewSub(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Music" /></div>
          <div><label>Usage</label><select value={newSub.usage} onChange={e => setNewSub(p => ({ ...p, usage: e.target.value as any }))}><option value="often">Often</option><option value="sometimes">Sometimes</option><option value="rarely">Rarely</option><option value="not-used">Not Used</option></select></div>
          <div><label>Account (optional)</label><select value={newSub.accountId} onChange={e => setNewSub(p => ({ ...p, accountId: e.target.value }))}><option value="">None</option>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newSub.autoDeduct} onChange={e => setNewSub(p => ({ ...p, autoDeduct: e.target.checked }))} /><span className="text-sm text-white/60">Auto-deduct</span></label>
          <button onClick={handleAddSub} className="btn-primary w-full">Add Subscription</button>
        </div>
      </Modal>

      <Modal open={orderModal} onClose={() => setOrderModal(false)} title="Add Order">
        <div className="space-y-3">
          <div><label>Item Name</label><input value={newOrder.itemName} onChange={e => setNewOrder(p => ({ ...p, itemName: e.target.value }))} placeholder="e.g. MacBook Pro" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label>Price</label><input type="number" value={newOrder.price} onChange={e => setNewOrder(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} /></div><div><label>Status</label><select value={newOrder.status} onChange={e => setNewOrder(p => ({ ...p, status: e.target.value as any }))}><option value="ordered">Ordered</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="returned">Returned</option><option value="cancelled">Cancelled</option></select></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label>Date Bought</label><input type="date" value={newOrder.dateBought} onChange={e => setNewOrder(p => ({ ...p, dateBought: e.target.value }))} /></div><div><label>Expected Delivery</label><input type="date" value={newOrder.expectedDelivery} onChange={e => setNewOrder(p => ({ ...p, expectedDelivery: e.target.value }))} /></div></div>
          <div><label>Account (optional)</label><select value={newOrder.accountId} onChange={e => setNewOrder(p => ({ ...p, accountId: e.target.value }))}><option value="">None</option>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newOrder.deductFromAccount} onChange={e => setNewOrder(p => ({ ...p, deductFromAccount: e.target.checked }))} /><span className="text-sm text-white/60">Deduct from account</span></label>
          <div><label>Notes</label><textarea value={newOrder.notes} onChange={e => setNewOrder(p => ({ ...p, notes: e.target.value }))} /></div>
          <button onClick={handleAddOrder} className="btn-primary w-full">Add Order</button>
        </div>
      </Modal>

      <Modal open={wishlistModal} onClose={() => setWishlistModal(false)} title="Add Wishlist Item">
        <div className="space-y-3">
          <div><label>Item Name</label><input value={newWishlist.name} onChange={e => setNewWishlist(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sony A7 IV" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label>Price</label><input type="number" value={newWishlist.price} onChange={e => setNewWishlist(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} /></div><div><label>Priority</label><select value={newWishlist.priority} onChange={e => setNewWishlist(p => ({ ...p, priority: e.target.value as any }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div></div>
          <div><label>Category</label><input value={newWishlist.category} onChange={e => setNewWishlist(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Camera" /></div>
          <div><label>Link (optional)</label><input value={newWishlist.link} onChange={e => setNewWishlist(p => ({ ...p, link: e.target.value }))} placeholder="URL" /></div>
          <div><label>Notes (optional)</label><textarea value={newWishlist.notes} onChange={e => setNewWishlist(p => ({ ...p, notes: e.target.value }))} /></div>
          <button onClick={handleAddWishlist} className="btn-primary w-full">Add to Wishlist</button>
        </div>
      </Modal>

      <Modal open={incomeModal} onClose={() => setIncomeModal(false)} title="Add Income">
        <div className="space-y-3">
          <div><label>Source</label><input value={newIncome.source} onChange={e => setNewIncome(p => ({ ...p, source: e.target.value }))} placeholder="e.g. Salary" /></div>
          <div><label>Amount</label><input type="number" value={newIncome.amount} onChange={e => setNewIncome(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></div>
          <div><label>Date</label><input type="date" value={newIncome.date} onChange={e => setNewIncome(p => ({ ...p, date: e.target.value }))} /></div>
          <div><label>Account (optional)</label><select value={newIncome.accountId} onChange={e => setNewIncome(p => ({ ...p, accountId: e.target.value }))}><option value="">None</option>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newIncome.recurring} onChange={e => setNewIncome(p => ({ ...p, recurring: e.target.checked }))} /><span className="text-sm text-white/60">Recurring</span></label>
          {newIncome.recurring && (
            <div><label>Frequency</label><select value={newIncome.frequency} onChange={e => setNewIncome(p => ({ ...p, frequency: e.target.value as any }))}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
          )}
          <button onClick={handleAddIncome} className="btn-primary w-full">Add Income</button>
        </div>
      </Modal>
    </div>
  );
}
