'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  ExternalLink,
  Award,
  AlertTriangle,
  Sparkles,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { VERIFICATION_OPTIONS, VerificationOption } from '../lib/verificationOptions';
import { api } from '../lib/api';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: 'NGO' | 'DONOR' | 'DRIVER';
  entityName: string;
  currentDocType?: string;
  currentDocNumber?: string;
  onVerifiedSuccess?: (data: any) => void;
}

export default function VerificationModal({
  isOpen,
  onClose,
  role,
  entityName,
  currentDocType,
  currentDocNumber,
  onVerifiedSuccess,
}: Props) {
  const options = VERIFICATION_OPTIONS[role] || [];
  const initialOption = options.find((o) => o.id === currentDocType) || options[0];

  const [selectedDocId, setSelectedDocId] = useState<string>(initialOption?.id || '');
  const [docNumber, setDocNumber] = useState<string>(currentDocNumber || initialOption?.demoValue || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeOption = options.find((o) => o.id === selectedDocId) || options[0];

  const handleSelectOption = (opt: VerificationOption) => {
    setSelectedDocId(opt.id);
    setDocNumber(opt.demoValue);
    setResult(null);
    setErrorMsg(null);
  };

  const handleVerifyAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOption) return;

    setIsVerifying(true);
    setErrorMsg(null);
    setResult(null);

    try {
      // 1. Verify against sovereign registry standards
      const verifyRes = await api.verifyCredentials({
        role,
        document_type: activeOption.id,
        document_number: docNumber,
        entity_name: entityName,
      });

      // 2. Persist to backend database verification case
      const saveRes = await api.submitVerification({
        role,
        document_type: activeOption.id,
        document_number: docNumber,
        entity_name: entityName,
      });

      setResult({
        ...verifyRes,
        ...saveRes.verification,
      });

      if (onVerifiedSuccess) {
        onVerifiedSuccess(saveRes.verification);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check identifier format.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Portal>
      <div className="modal-overlay">
      <div className="modal-panel relative w-full max-w-3xl overflow-hidden my-8 bg-[#08120B] border border-[#1B3322] shadow-2xl text-white">
        {/* Modal Header */}
        <div className="bg-[#0B150F] text-white p-6 sm:p-7 flex items-center justify-between border-b border-[#1B3322]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#162D1F] text-[#4ADE80] flex items-center justify-center border border-[#22C55E]/40 shadow-glow-apple">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white font-display">
                  {role === 'NGO'
                    ? 'NGO Statutory Verification'
                    : role === 'DONOR'
                    ? 'Restaurant & Kitchen Verification'
                    : 'Delivery Partner Trust Identity'}
                </h3>
                <span className="badge badge-basil text-[10px]">Verified Credential</span>
              </div>
              <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                Select one of the {options.length} recognized statutory documents for <strong className="text-white">{entityName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-white rounded-xl hover:bg-[#162D1F] transition btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleVerifyAndSave} className="p-6 sm:p-8 space-y-6">
          {/* Options Grid */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-white">
              Select One Verification Document:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {options.map((opt, idx) => {
                const isSelected = selectedDocId === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border flex flex-col justify-between text-left btn-press ${
                      isSelected
                        ? 'bg-[#0E1E14] text-white border-[#22C55E] shadow-glow-apple ring-2 ring-[#4ADE80]/30'
                        : 'bg-[#0D1812] hover:bg-[#112017] text-white border-[#1B3322]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-[#162D1F] text-[#4ADE80] border-[#22C55E]/40'
                              : 'bg-[#060D09] text-[#94A3B8] border-[#1B3322]'
                          }`}
                        >
                          Document #{idx + 1}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0" />}
                      </div>
                      <h4 className="font-black text-sm leading-snug font-display text-white">
                        {opt.title}
                      </h4>
                      <p className="text-xs leading-relaxed line-clamp-3 text-[#94A3B8]">
                        {opt.description}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-dashed border-white/10 text-[10px] font-bold">
                      <span className={isSelected ? 'text-[#4ADE80]' : 'text-[#86EFAC]'}>
                        {opt.badgeText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Option Form Inputs */}
          {activeOption && (
            <div className="space-y-4 pt-2 border-t border-[#1B3322]">
              <div className="p-4 rounded-2xl bg-[#0D1812] border border-[#1B3322] space-y-1.5 shadow-dark-highlight">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
                    <FileCheck className="w-4 h-4 text-[#4ADE80]" />
                    <span>Selected: {activeOption.title}</span>
                  </span>
                  <a
                    href={activeOption.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-[#4ADE80] hover:text-[#86EFAC] hover:underline flex items-center gap-1"
                  >
                    <span>Check Official Registry</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  {activeOption.description}
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  Issuing Authority: <strong className="text-white">{activeOption.issuingAuthority}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
                  {activeOption.identifierLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder={activeOption.identifierPlaceholder}
                    required
                    className="input-warm pl-10 pr-4 py-2.5 font-mono bg-[#060D09] border-[#1B3322] text-white focus:border-[#22C55E]"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mt-1.5">
                  <span>Demo sample: <code className="bg-[#060D09] border border-[#1B3322] px-1.5 py-0.5 rounded text-[#4ADE80] font-mono text-[11px]">{activeOption.demoValue}</code></span>
                  <button
                    type="button"
                    onClick={() => setDocNumber(activeOption.demoValue)}
                    className="text-[#4ADE80] font-bold hover:underline"
                  >
                    Load Sample Number
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Result Banner */}
          {result && (
            <div className="p-4 bg-[#0E1E14] border border-[#22C55E] rounded-2xl text-xs space-y-1 text-[#86EFAC] animate-in fade-in duration-200 shadow-glow-apple">
              <div className="flex items-center gap-2 font-black font-display text-white">
                <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0" />
                <span>Verified &amp; Sealed in Sovereign Registry</span>
                <span className="font-mono text-[10px] bg-[#162D1F] border border-[#22C55E]/40 px-2 py-0.5 rounded font-bold text-[#4ADE80]">
                  {result.digital_seal_hash}
                </span>
              </div>
              <p className="text-[#CBD5E1]">{result.compliance_notes}</p>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="alert-error flex items-center gap-2 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1B3322]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#1B3322] text-[#94A3B8] hover:bg-[#162D1F] hover:text-white text-xs font-bold transition btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !docNumber}
              className="btn-terra px-6 py-2.5 text-xs font-bold flex items-center gap-2 disabled:opacity-50 btn-press shadow-glow-apple"
            >
              {isVerifying ? (
                <span>Validating with Registry...</span>
              ) : (
                <>
                  <BadgeCheck className="w-4 h-4 text-white" />
                  <span>Verify &amp; Save Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Portal>
);
}
