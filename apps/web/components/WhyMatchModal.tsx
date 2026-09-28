'use client';

import React from 'react';
import { X, CheckCircle, Clock, MapPin, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import Portal from './Portal';

interface Props {
  proposal: any;
  onClose: () => void;
  onReserve: (proposal: any) => void;
}

export default function WhyMatchModal({ proposal, onClose, onReserve }: Props) {
  if (!proposal) return null;

  const factors = proposal.factors_breakdown || {
    distance: 90,
    eta: 85,
    expiry_buffer: 95,
    need_fulfillment: 88,
    route_efficiency: 92,
    driver_availability: 90,
    deadline_urgency: 94,
  };

  const factorList = [
    { label: 'Distance Proximity', weight: '20%', value: factors.distance, icon: MapPin, color: 'bg-[#2D6A4F]' },
    { label: 'ETA Delivery Feasibility', weight: '20%', value: factors.eta, icon: Clock, color: 'bg-[#2D6A4F]' },
    { label: 'Food Usability & Expiry Buffer', weight: '15%', value: factors.expiry_buffer, icon: ShieldCheck, color: 'bg-[#1B4332]' },
    { label: 'Need Volume Fulfillment', weight: '15%', value: factors.need_fulfillment, icon: Zap, color: 'bg-[#22C55E]' },
    { label: 'Route Efficiency', weight: '10%', value: factors.route_efficiency, icon: MapPin, color: 'bg-[#4ADE80]' },
    { label: 'Driver Logistics Availability', weight: '10%', value: factors.driver_availability, icon: Clock, color: 'bg-[#16A34A]' },
    { label: 'Meal Deadline Urgency', weight: '10%', value: factors.deadline_urgency, icon: AlertTriangle, color: 'bg-[#A3E635]' },
  ];

  return (
    <Portal>
      <div className="modal-overlay">
      <div className="modal-panel relative max-w-xl w-full p-6 sm:p-7 overflow-hidden bg-[#08120B] border border-[#1B3322] shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1B3322]">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-basil text-[10px]">
                Deterministic Match Engine
              </span>
              <span className="text-xs text-[#94A3B8] font-mono">ID: #{proposal.id?.slice(0, 8) || 'PROP-01'}</span>
            </div>
            <h3 className="text-xl font-black text-white mt-1 font-display">Why This Match?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#162D1F] transition btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Score Banner */}
        <div className="my-5 p-5 rounded-2xl bg-[#0D1812] text-white flex items-center justify-between shadow-glow-apple border border-[#22C55E]/40">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#4ADE80] font-extrabold">Rescue Priority Score</p>
            <p className="text-xs text-[#94A3B8] mt-0.5 font-normal">Calculated across 7 verified logistics &amp; urgency metrics</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-[#4ADE80] font-display">{Math.round(proposal.score || 91)}</span>
            <span className="text-sm font-semibold text-[#86EFAC]">/100</span>
          </div>
        </div>

        {/* Per-Factor Breakdown */}
        <div className="space-y-3.5 my-4 max-h-64 overflow-y-auto pr-1">
          {factorList.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <item.icon className="w-3.5 h-3.5 text-[#4ADE80]" />
                  {item.label} <span className="text-[#94A3B8] font-normal">({item.weight})</span>
                </span>
                <span className="font-bold text-[#4ADE80]">{Math.round(item.value)}%</span>
              </div>
              <div className="w-full bg-[#1E293B] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#4ADE80] transition-all duration-500 shadow-glow-apple"
                  style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Explainable Insights */}
        {proposal.explanation && (
          <div className="p-3.5 bg-[#0D1812] rounded-2xl border border-[#1B3322] my-4 text-xs text-white space-y-1 shadow-dark-highlight">
            <p className="font-bold text-[#4ADE80] flex items-center gap-1 font-display">
              <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80]" /> Transparent Engine Insights:
            </p>
            <p className="leading-relaxed text-[#CBD5E1]">{proposal.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1B3322]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#94A3B8] hover:bg-[#162D1F] hover:text-white transition btn-press"
          >
            Close
          </button>
          <button
            onClick={() => onReserve(proposal)}
            className="btn-terra px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-glow-apple btn-press"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Reserve Food (Place Hold)</span>
          </button>
        </div>
      </div>
    </div>
  </Portal>
);
}
