'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Layers
} from 'lucide-react';
import { getSupabaseConfig, testSupabaseConnection } from '../lib/supabase';
import { realDb } from '../lib/db';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export default function DatabaseModal({ isOpen, onClose }: Props) {
  const [isConnected, setIsConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [counts, setCounts] = useState<{ donations: number; needs: number; jobs: number }>({
    donations: 0,
    needs: 0,
    jobs: 0,
  });

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setIsConnected(cfg.isConnected);
      setTestResult(null);

      // Load counts
      Promise.all([realDb.getDonations(), realDb.getNeeds(), realDb.getDeliveryJobs()]).then(
        ([donations, needs, jobs]) => {
          setCounts({
            donations: donations.length,
            needs: needs.length,
            jobs: jobs.length,
          });
        }
      );
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="modal-overlay">
      <div className="modal-panel relative max-w-2xl w-full overflow-hidden flex flex-col my-8 bg-[#08120B] border border-[#1B3322] shadow-2xl text-white">
        {/* Header */}
        <div className="bg-[#0B150F] p-6 sm:p-7 text-white flex items-center justify-between border-b border-[#1B3322]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#162D1F] text-[#4ADE80] flex items-center justify-center border border-[#22C55E]/40 shadow-glow-apple">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white font-display">Database &amp; Cloud Persistence</h3>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    isConnected
                      ? 'bg-[#162D1F] text-[#4ADE80] border-[#22C55E]/40'
                      : 'bg-[#162D1F] text-[#86EFAC] border-[#22C55E]/40'
                  }`}
                >
                  {isConnected ? 'Supabase Cloud Configured' : 'Local Persistent Storage Active'}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                All food donations, beneficiary meal needs, and live delivery jobs are safely persisted.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#162D1F] transition btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Banner */}
          <div className="p-4 rounded-2xl border flex items-start gap-3.5 bg-[#0D1812] border-[#22C55E]/40 text-[#86EFAC] shadow-glow-apple">
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-[#4ADE80] shrink-0 mt-0.5" />
            ) : (
              <HardDrive className="w-5 h-5 text-[#4ADE80] shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm font-display text-white">
                {isConnected
                  ? 'Connected to Supabase Cloud PostgreSQL'
                  : 'Zero-Config Local Persistent Storage Active'}
              </p>
              <p className="text-[#CBD5E1] leading-relaxed">
                {isConnected
                  ? 'Your inputs are actively synced to your Supabase PostgreSQL cloud instance. Records are accessible in your Supabase dashboard.'
                  : 'All information entered by you (users, donations, requests, deliveries) is saved persistently in local storage. Connect your Supabase project below to sync everything to the cloud.'}
              </p>
            </div>
          </div>

          {/* Real Database Table Stats */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2.5 font-display">
              Live Database Stored Records
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0D1812] border border-[#1B3322] text-center shadow-dark-highlight">
                <p className="text-[11px] font-semibold text-[#94A3B8]">Surplus Donations</p>
                <p className="text-xl font-black text-[#4ADE80] mt-1 font-display">{counts.donations}</p>
                <span className="text-[10px] text-[#86EFAC] font-mono">table: donations</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0D1812] border border-[#1B3322] text-center shadow-dark-highlight">
                <p className="text-[11px] font-semibold text-[#94A3B8]">NGO Relief Needs</p>
                <p className="text-xl font-black text-[#86EFAC] mt-1 font-display">{counts.needs}</p>
                <span className="text-[10px] text-[#86EFAC] font-mono">table: needs</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0D1812] border border-[#1B3322] text-center shadow-dark-highlight">
                <p className="text-[11px] font-semibold text-[#94A3B8]">Rescue Deliveries</p>
                <p className="text-xl font-black text-white mt-1 font-display">{counts.jobs}</p>
                <span className="text-[10px] text-[#94A3B8] font-mono">table: delivery_jobs</span>
              </div>
            </div>
          </div>

          {/* Form / Security Information */}
          <div className="space-y-4 pt-2 border-t border-[#1B3322]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white font-display flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
                <span>Database Credentials Security</span>
              </h4>
              <span className="text-[10px] font-bold text-[#4ADE80] bg-[#162D1F] px-2 py-0.5 rounded-full border border-[#22C55E]/40">
                Environment Protected
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1812] border border-[#1B3322] text-xs text-[#CBD5E1] space-y-1">
              <p className="font-bold text-white">Protected Architecture</p>
              <p className="text-[11px] leading-relaxed text-[#94A3B8] font-body">
                Direct client-side access, browser storage, and manual credential editing are disabled to prevent security exposure. Database connectivity is managed securely via server environment variables (<code className="font-mono text-[#4ADE80] bg-[#060D09] px-1 py-0.5 rounded border border-[#1B3322]">.env</code>).
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Supabase Project URL
                </label>
                <div className="input-warm font-mono text-xs bg-[#060D09] border-[#1B3322] text-[#94A3B8] flex items-center justify-between cursor-not-allowed select-none">
                  <span>{isConnected ? 'https://••••••••••••••••.supabase.co' : 'Not configured'}</span>
                  <span className="text-[10px] uppercase font-bold text-[#4ADE80]">Server Bound</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Supabase API Access Key
                </label>
                <div className="input-warm font-mono text-xs bg-[#060D09] border-[#1B3322] text-[#94A3B8] flex items-center justify-between cursor-not-allowed select-none">
                  <span>{isConnected ? '••••••••••••••••••••••••••••••••••••••••••••••••' : 'Not configured'}</span>
                  <span className="text-[10px] uppercase font-bold text-[#4ADE80]">Encrypted</span>
                </div>
              </div>
            </div>

            {/* Test result message */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-[#0E1E14] text-[#86EFAC] border border-[#22C55E] shadow-glow-apple'
                    : 'alert-error'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !isConnected}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#162D1F] hover:bg-[#1C3A27] text-[#4ADE80] border border-[#22C55E]/40 transition flex items-center gap-1.5 disabled:opacity-50 btn-press shadow-glow-apple"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Verifying Diagnostics...' : 'Verify Cloud Diagnostics'}</span>
              </button>
            </div>
          </div>

          {/* SQL Schema Instructions Box */}
          <div className="p-4 rounded-2xl bg-[#0D1812] text-white text-xs space-y-2 border border-[#1B3322] shadow-dark-highlight">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-white font-display">
                <Layers className="w-4 h-4 text-[#4ADE80]" />
                <span>Supabase SQL Migration File</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#162D1F] text-[#4ADE80] font-mono border border-[#22C55E]/30">
                supabase/migrations/001_initial_schema.sql
              </span>
            </div>
            <p className="text-[#94A3B8] text-[11px] leading-relaxed">
              The project includes a complete PostgreSQL schema in the{' '}
              <code className="bg-[#060D09] px-1.5 py-0.5 rounded text-[#4ADE80] font-mono border border-[#1B3322]">supabase/migrations</code> folder.
              To apply all tables (profiles, organizations, donations, needs, delivery_jobs), copy the contents of{' '}
              <code className="bg-[#060D09] px-1.5 py-0.5 rounded text-[#4ADE80] font-mono border border-[#1B3322]">001_initial_schema.sql</code> into your{' '}
              <strong className="text-white">Supabase Dashboard → SQL Editor</strong> and click Run.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#060D09] px-6 py-4 border-t border-[#1B3322] flex items-center justify-between">
          <p className="text-xs text-[#94A3B8]">
            PostgreSQL • PostGIS Logistics • Persistent Zero-Loss Sync
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#162D1F] hover:bg-[#1C3A27] text-[#4ADE80] border border-[#22C55E]/40 font-bold text-xs transition btn-press"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </Portal>
);
}
