'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { api } from '@/utils/api';

export default function SettingsPage() {
  const { address, isConnected, chainId } = useAccount();
  const [costBasis, setCostBasis] = useState('HIFO');
  const [harvestThreshold, setHarvestThreshold] = useState(100);
  const [notifications, setNotifications] = useState(true);
  const [autoHarvest, setAutoHarvest] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings({
        cost_basis_method: costBasis,
        harvest_threshold_usd: harvestThreshold,
      });
      localStorage.setItem('taxfi_settings', JSON.stringify({
        costBasis, harvestThreshold, notifications, autoHarvest,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-200/40">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-500">Connect your wallet to configure settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          Configure your TaxFi preferences
        </p>
      </div>

      {/* Cost Basis Method */}
      <div className="bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-8 shadow-lg shadow-emerald-500/5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Cost Basis Method</h2>
        <p className="text-gray-500 text-sm mb-5 leading-relaxed">
          Determines how TaxFi calculates your cost basis when selling assets.
        </p>
        <div className="space-y-3">
          {[
            { value: 'HIFO', label: 'HIFO (Highest In, First Out)', desc: 'Minimizes gains, tax-optimal', recommended: true },
            { value: 'FIFO', label: 'FIFO (First In, First Out)', desc: 'Default IRS method' },
            { value: 'LIFO', label: 'LIFO (Last In, First Out)', desc: 'Sell newest first' },
            { value: 'ACB', label: 'ACB (Average Cost)', desc: 'Average cost across all lots' },
          ].map((method) => (
            <label
              key={method.value}
              className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                costBasis === method.value
                  ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/60 shadow-sm'
                  : 'bg-emerald-50/20 border border-transparent hover:bg-emerald-50/50 hover:border-emerald-100/40'
              }`}
            >
              <input
                type="radio"
                name="costBasis"
                value={method.value}
                checked={costBasis === method.value}
                onChange={(e) => setCostBasis(e.target.value)}
                className="mt-1 accent-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 font-medium">{method.label}</p>
                  {method.recommended && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700">Recommended</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-0.5">{method.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Harvest Settings */}
      <div className="bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-8 shadow-lg shadow-emerald-500/5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Harvest Settings</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-gray-500 text-sm mb-2">Minimum Harvest Threshold (USD)</label>
            <div className="flex items-center gap-3">
              <span className="text-gray-900 text-lg font-semibold">$</span>
              <input
                type="number"
                value={harvestThreshold}
                onChange={(e) => setHarvestThreshold(Number(e.target.value))}
                className="bg-white border border-emerald-200/60 rounded-xl px-4 py-2.5 text-gray-900 w-32 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <p className="text-gray-500 text-sm mt-2">Only report harvest opportunities above this amount</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-4 bg-emerald-50/20 rounded-xl hover:bg-emerald-50/50 transition-colors">
            <input
              type="checkbox"
              checked={autoHarvest}
              onChange={(e) => setAutoHarvest(e.target.checked)}
              className="mt-1 w-5 h-5 rounded accent-emerald-500"
            />
            <div>
              <p className="text-gray-900 font-medium">Auto-execute small harvests</p>
              <p className="text-gray-500 text-sm">Automatically execute harvests under $500 without confirmation</p>
            </div>
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-8 shadow-lg shadow-emerald-500/5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Notifications</h2>
        <label className="flex items-start gap-3 cursor-pointer p-4 bg-emerald-50/20 rounded-xl hover:bg-emerald-50/50 transition-colors">
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            className="mt-1 w-5 h-5 rounded accent-emerald-500"
          />
          <div>
            <p className="text-gray-900 font-medium">Push Notifications</p>
            <p className="text-gray-500 text-sm">Get notified about new harvest opportunities</p>
          </div>
        </label>
      </div>

      {/* Account Info */}
      <div className="bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-8 shadow-lg shadow-emerald-500/5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Account</h2>
        {address && (
          <div className="space-y-3">
            {[
              { label: 'Wallet', value: address, mono: true, small: true },
              { label: 'Chain', value: chainId ? `Chain ID: ${chainId}` : 'Connected' },
              { label: 'TaxFi Fee', value: '5% of tax savings', accent: true },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-emerald-50/20 rounded-xl border border-emerald-100/40">
                <span className="text-gray-500 text-sm">{row.label}</span>
                <span className={`font-semibold text-right ${row.accent ? 'text-emerald-600' : 'text-gray-900'} ${row.mono ? 'font-mono' : ''} ${row.small ? 'text-sm' : ''}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving</>
            ) : (
              'Save Settings'
            )}
          </span>
        </button>
        {saved && (
          <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Settings saved
          </span>
        )}
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200/60 bg-red-50/50 backdrop-blur-sm rounded-[1.5rem] p-8">
        <h3 className="text-red-700 font-bold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Danger Zone
        </h3>
        <div className="space-y-4">
          {[
            { title: 'Clear Portfolio Data', desc: 'Remove all cost basis and transaction data' },
            { title: 'Delete Account', desc: 'Permanently delete your TaxFi account and all data' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-red-100/40">
              <div>
                <p className="text-gray-900 font-medium text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
              </div>
              <button className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-medium hover:shadow-lg hover:shadow-red-500/30">
                {item.title === 'Delete Account' ? 'Delete' : 'Clear'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
