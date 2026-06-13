'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import Link from 'next/link';
import { useMetaMaskPermissions } from '@/hooks/useMetaMaskPermissions';

export default function PermissionGrantPage() {
  const { address, isConnected } = useAccount();
  const { supportsErc7715, hasHarvestPermission, requestHarvestPermission, checkPermissions, isLoading, error } = useMetaMaskPermissions();
  const [step, setStep] = useState<'intro' | 'signing' | 'granted'>('intro');
  const [permissionScope, setPermissionScope] = useState({
    readOnly: true,
    executeHarvest: false,
    chains: ['eip155:1', 'eip155:8453', 'eip155:42161'],
    maxDailyValue: 10000,
  });

  const handleSign = async () => {
    if (!address) return;
    setStep('signing');
    try {
      if (permissionScope.executeHarvest) {
        const amount = parseUnits(permissionScope.maxDailyValue.toString(), 6);
        await requestHarvestPermission(amount, 1);
      }
      setStep('granted');
      await checkPermissions();
    } catch {
      setStep('intro');
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-200/40">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Grant Permissions</h2>
        <p className="text-gray-500">Connect your wallet to grant TaxFi access</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-3xl border border-emerald-200/60 text-emerald-600 text-sm font-medium mb-6 shadow-2xl shadow-emerald-500/10">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ERC-7715 Permissions
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-3">Grant TaxFi Permissions</h1>
        <p className="text-gray-500">Configure what access TaxFi has to your wallet</p>
      </div>

      {step === 'intro' && (
        <>
          {/* Permission Scope */}
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-8 shadow-lg shadow-emerald-500/5">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Permission Scope</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 bg-emerald-50/20 rounded-xl cursor-pointer hover:bg-emerald-50/50 transition-colors border border-transparent hover:border-emerald-100/40">
                <input
                  type="checkbox"
                  checked={permissionScope.readOnly}
                  onChange={(e) => {
                    setPermissionScope(s => ({ ...s, readOnly: e.target.checked }));
                    if (e.target.checked) setPermissionScope(s => ({ ...s, executeHarvest: false }));
                  }}
                  className="mt-1 w-5 h-5 rounded accent-emerald-500"
                />
                <div>
                  <p className="text-gray-900 font-medium">Read-Only Access</p>
                  <p className="text-gray-500 text-sm mt-0.5">TaxFi can read your transaction history and balance</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-emerald-50/20 rounded-xl cursor-pointer hover:bg-emerald-50/50 transition-colors border border-transparent hover:border-emerald-100/40">
                <input
                  type="checkbox"
                  checked={permissionScope.executeHarvest}
                  onChange={(e) => {
                    setPermissionScope(s => ({ ...s, executeHarvest: e.target.checked }));
                    if (!e.target.checked) setPermissionScope(s => ({ ...s, readOnly: true }));
                  }}
                  className="mt-1 w-5 h-5 rounded accent-emerald-500"
                />
                <div>
                  <p className="text-gray-900 font-medium">Execute Tax Loss Harvests</p>
                  <p className="text-gray-500 text-sm mt-0.5">TaxFi can execute harvest transactions up to ${permissionScope.maxDailyValue.toLocaleString()}/day</p>
                </div>
              </label>

              <div>
                <label className="block text-gray-500 text-sm mb-2">Max Daily Harvest Value (USD)</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-semibold">$</span>
                  <input
                    type="number"
                    value={permissionScope.maxDailyValue}
                    onChange={(e) => setPermissionScope(s => ({ ...s, maxDailyValue: Number(e.target.value) }))}
                    disabled={!permissionScope.executeHarvest}
                    className="bg-white border border-emerald-200/60 rounded-xl px-4 py-2.5 text-gray-900 w-full max-w-[200px] disabled:opacity-50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 text-sm mb-2">Chains</label>
                <div className="flex flex-wrap gap-2">
                  {['eip155:1', 'eip155:8453', 'eip155:42161'].map(chain => (
                    <button
                      key={chain}
                      onClick={() => {
                        const chains = permissionScope.chains.includes(chain)
                          ? permissionScope.chains.filter(c => c !== chain)
                          : [...permissionScope.chains, chain];
                        setPermissionScope(s => ({ ...s, chains }));
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        permissionScope.chains.includes(chain)
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                          : 'bg-white/50 text-gray-500 border border-gray-200/60 hover:border-emerald-200 hover:text-emerald-600'
                      }`}
                    >
                      {chain.replace('eip155:', '').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trust Summary */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-xl border border-emerald-200/60 rounded-[1.5rem] p-8 shadow-lg">
            <h3 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              What You&apos;re Granting
            </h3>
            <div className="space-y-2 text-gray-600 text-sm">
              {[
                { granted: permissionScope.readOnly, text: 'Read transaction history' },
                { granted: permissionScope.readOnly, text: 'View balances and positions' },
                { granted: permissionScope.executeHarvest, text: `Execute trades up to $${permissionScope.maxDailyValue.toLocaleString()}/day` },
                { granted: true, text: 'Revoke anytime' },
                { granted: true, text: 'Expires in 365 days' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.granted ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSign}
            disabled={isLoading}
            className="relative w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group text-lg"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Grant Permissions
            </span>
          </button>

          <p className="text-center text-gray-500 text-sm">
            This uses ERC-7715. You will see exactly what you are signing in your wallet.
          </p>
        </>
      )}

      {step === 'signing' && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-200/40">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Wallet</h2>
          <p className="text-gray-500">Sign the permission request in MetaMask to continue</p>
        </div>
      )}

      {step === 'granted' && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Permissions Granted</h2>
          <p className="text-gray-500 mb-6">TaxFi can now access your wallet. Start scanning to find tax savings.</p>
          <Link
            href="/dashboard"
            className="inline-flex px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.97]"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
