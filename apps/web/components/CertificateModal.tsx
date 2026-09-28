'use client';

import React from 'react';
import { X, Award, ShieldCheck, Download, Calendar, CheckCircle2 } from 'lucide-react';
import Portal from './Portal';

interface Props {
  certData: any;
  onClose: () => void;
}

export default function CertificateModal({ certData, onClose }: Props) {
  if (!certData) return null;

  return (
    <Portal>
      <div className="modal-overlay">
      <div className="modal-panel relative max-w-2xl w-full p-6 sm:p-10 overflow-hidden bg-[#08120B] border-2 border-[#22C55E]/40 shadow-2xl text-white">
        {/* Certificate Watermark / Header Design */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#16A34A] via-[#22C55E] to-[#4ADE80] shadow-glow-apple" />
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#162D1F] transition btn-press"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mt-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0D1812] border border-[#22C55E]/40 flex items-center justify-center text-[#4ADE80] shadow-glow-apple">
            <Award className="w-9 h-9 text-[#4ADE80]" />
          </div>
          <span className="badge badge-basil text-[10px]">
            Official Platform Impact Certificate
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            ANNASETU Verified Impact Reporting
          </h2>
          <p className="text-xs text-[#94A3B8] font-mono">
            Certificate ID: {certData.certificate_number || 'AS-CERT-98241'}
          </p>
        </div>

        {/* Certificate Body */}
        <div className="my-6 p-6 rounded-2xl bg-[#0D1812] border border-[#1B3322] text-center space-y-4 shadow-dark-highlight">
          <p className="text-xs text-[#94A3B8] uppercase tracking-wider font-bold">This certifies that</p>
          <h3 className="text-2xl font-black text-white font-display">{certData.donor_name || 'Taj Grand Kitchens'}</h3>
          <p className="text-xs text-[#CBD5E1] max-w-md mx-auto leading-relaxed">
            successfully rescued and transferred verified edible surplus food to{' '}
            <strong className="text-[#4ADE80]">{certData.recipient_ngo || 'Mumbai Roti Bank'}</strong> via the
            ANNASETU Trust-Chain Delivery Network.
          </p>

          <div className="grid grid-cols-3 gap-3 py-4 border-y border-[#1B3322] text-center">
            <div>
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Rescued Batch</span>
              <span className="text-2xl font-black text-white font-display">{certData.food_rescued_kg || 25} kg</span>
            </div>
            <div>
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Meals Served</span>
              <span className="text-2xl font-black text-[#4ADE80] font-display">{certData.meals_supported || 50}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">CO2e Avoided</span>
              <span className="text-2xl font-black text-[#A3E635] font-display">{certData.co2e_avoided_kg || 62.5} kg</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#86EFAC]">
            <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
            <span>Cryptographic Trust Chain Verified: Sealed Package • Pickup OTP • Delivery OTP</span>
          </div>
        </div>

        {/* Guardrail Disclaimer */}
        <p className="text-[10px] text-[#94A3B8] text-center leading-normal px-4">
          {certData.wording_disclaimer ||
            'ANNASETU Verified Impact Reporting & Sustainability Documentation. Issued as verified documentation to support applicable corporate tax, CSR 80G, and sustainability reporting.'}
        </p>

        {/* Action Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => window.print()}
            className="btn-terra px-6 py-2.5 text-xs font-bold shadow-glow-apple transition flex items-center gap-2 btn-press"
          >
            <Download className="w-4 h-4" />
            <span>Download Official Documentation</span>
          </button>
        </div>
      </div>
    </div>
  </Portal>
);
}
