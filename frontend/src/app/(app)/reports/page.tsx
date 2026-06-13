'use client';

import { useState } from 'react';
import { useTaxFi } from '@/hooks/useTaxFi';
import { useAccount } from 'wagmi';
import { useToast } from '@/components/Toast';
import { ScrollReveal } from '@/components/ScrollReveal';
import PageHeader from '../_components/PageHeader';
import EmptyState from '../_components/EmptyState';
import YearSelector from './_components/YearSelector';
import FormCard from './_components/FormCard';

const FORM_TYPES = [
  { key: 'form_8949', name: 'Form 8949', desc: 'Sales & Dispositions' },
  { key: 'schedule_d', name: 'Schedule D', desc: 'Capital Gains' },
  { key: 'schedule_1', name: 'Schedule 1', desc: 'Additional Income' },
  { key: 'summary', name: 'Summary', desc: 'Plain English' },
];

export default function ReportsPage() {
  const { address, isConnected } = useAccount();
  const { taxForms, generateForms, isLoading } = useTaxFi();
  const toast = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateForms(selectedYear);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (formType: string) => {
    toast.info('Download Started', `Preparing ${formType} for ${selectedYear}...`);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-200/40">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tax Reports</h2>
        <p className="text-gray-500">Connect your wallet to generate tax reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ScrollReveal>
        <PageHeader title="Tax Reports" subtitle="Generate IRS-compliant tax forms" />
      </ScrollReveal>

      <ScrollReveal>
        <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
      </ScrollReveal>

      <ScrollReveal>
        <button
          onClick={handleGenerate}
          disabled={generating || isLoading}
          className="relative w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Forms
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate {selectedYear} Tax Forms
              </>
            )}
          </span>
        </button>
      </ScrollReveal>

      {taxForms && (
        <div className="space-y-6 animate-slide-up">
          {/* Summary */}
          <ScrollReveal>
            <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-xl border border-emerald-200/60 rounded-[1.5rem] p-8 shadow-lg">
              <h3 className="text-lg font-bold text-emerald-900 mb-6">Tax Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Net Capital Gain', value: `$${taxForms.summary?.key_numbers?.net_capital_gain?.replace('$', '') || '0'}`, color: 'text-gray-900' },
                  { label: 'Other Income', value: `$${taxForms.summary?.key_numbers?.other_income?.replace('$', '') || '0'}`, color: 'text-gray-900' },
                  { label: 'Estimated Tax Owed', value: `$${taxForms.estimated_tax?.toLocaleString() || '0'}`, color: 'text-emerald-600' },
                  { label: 'TaxFi Savings', value: `$${taxForms.harvest_savings?.toLocaleString() || '0'}`, color: 'text-emerald-600' },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-white/50 rounded-xl border border-emerald-100/40">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Form Cards */}
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {FORM_TYPES.map(({ key, name, desc }) => (
                <FormCard
                  key={key}
                  name={name}
                  desc={desc}
                  form={taxForms.forms?.[key] || null}
                  onDownload={() => handleDownload(key)}
                />
              ))}
            </div>
          </ScrollReveal>

          {/* Onchain Attestation */}
          {taxForms.onchain_hashes && (
            <ScrollReveal>
              <div className="bg-emerald-50/80 backdrop-blur-xl border border-emerald-200/60 rounded-[1.5rem] p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-200/40">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-emerald-800 font-bold mb-2">Onchain Attestation</h4>
                    <p className="text-gray-600 text-sm">These forms have been anchored onchain via TaxFormAttestor for an immutable audit trail.</p>
                    <div className="mt-3 space-y-1">
                      {Object.entries(taxForms.onchain_hashes).map(([form, hash]) => (
                        <p key={form} className="text-xs text-gray-500 font-mono">{form}: {String(hash).slice(0, 10)}...</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      )}

      {!taxForms && !generating && (
        <ScrollReveal>
          <EmptyState
            title="Generate Your Tax Forms"
            description="Select a tax year above and click generate to create IRS-compliant forms (Form 8949, Schedule D, Schedule 1) from your transaction history."
          />
        </ScrollReveal>
      )}
    </div>
  );
}
