'use client';

import React from 'react';
import {
  X,
  Truck,
  MapPin,
  Clock,
  Scale,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { DeclaredDeliveryFare, formatInr } from '../lib/pricing';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fare: DeclaredDeliveryFare | null;
  orderTitle?: string;
  donorName?: string;
}

export default function FareBreakdownModal({ isOpen, onClose, fare, orderTitle, donorName }: Props) {
  if (!isOpen || !fare) return null;

  const { breakdown } = fare;

  return (
    <Portal>
      <div className="modal-overlay">
      <div className="modal-panel relative max-w-xl w-full p-6 sm:p-7 overflow-hidden max-h-[92vh] overflow-y-auto bg-[#08120B] border border-[#1B3322] shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1B3322]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#162D1F] text-white flex items-center justify-center shadow-md font-bold border border-[#22C55E]/30">
              <Truck className="w-5 h-5 text-[#4ADE80]" />
            </div>
            <div>
              <span className="badge badge-basil text-[10px]">
                Transparent Logistics Quote
              </span>
              <h3 className="text-xl font-black text-white mt-0.5 font-display">
                Declared Delivery Amount Breakdown
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-white rounded-xl hover:bg-[#162D1F] transition btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Context Strip */}
        <div className="my-4 p-4 rounded-2xl bg-[#0D1812] border border-[#1B3322] text-xs flex items-center justify-between gap-3 shadow-dark-highlight">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">Rescue Mission</span>
            <p className="font-extrabold text-white truncate font-display">{orderTitle || 'Surplus Cooked Meals Batch'}</p>
            <p className="text-[11px] text-[#94A3B8]">Kitchen: {donorName || 'Taj Grand Kitchens'}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">Declared Amount</span>
            <p className="text-2xl font-black text-[#4ADE80] font-display">₹{Math.round(fare.totalAmountInr)}</p>
          </div>
        </div>

        {/* The 4 Pricing Pillars Considered */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-white font-display">
            The 4 Pricing Factors Considered:
          </p>

          {/* 1. Distance */}
          <div className="p-3.5 rounded-2xl border border-[#1B3322] bg-[#0D1812] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#4ADE80] shrink-0" />
                <span className="font-bold text-white">1. Distance ({fare.distanceKm} km)</span>
              </div>
              <span className="font-extrabold text-[#4ADE80]">
                ₹{Math.round(breakdown.distanceCharge + breakdown.longDistanceSurcharge)}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] pl-6 leading-relaxed">
              Base vehicle fare covers first {breakdown.includedDistanceKm} km. Billable transit: {breakdown.billableDistanceKm} km @ vehicle per-km rate.
              {breakdown.longDistanceSurcharge > 0 && (
                <span className="text-[#86EFAC] block font-semibold mt-0.5">
                  • Long-distance corridor surcharge (&gt;15 km deadhead buffer): +₹{breakdown.longDistanceSurcharge}
                </span>
              )}
            </p>
          </div>

          {/* 2. Vehicle Type */}
          <div className="p-3.5 rounded-2xl border border-[#1B3322] bg-[#0D1812] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#4ADE80] shrink-0" />
                <div>
                  <span className="font-bold text-white">2. Vehicle Type: {fare.vehicleName}</span>
                  <span className="text-[10px] text-[#94A3B8] ml-1.5 font-normal">({fare.vehicleClass})</span>
                </div>
              </div>
              <span className="font-extrabold text-[#4ADE80]">₹{Math.round(breakdown.vehicleBaseFare)}</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] pl-6 leading-relaxed">
              Vehicle class matched for hygienic food transit based on total weight load ({fare.weightKg} kg payload).
            </p>
          </div>

          {/* 3. Time of Delivery / Rush Hour */}
          <div className={`p-3.5 rounded-2xl border space-y-2 ${
            fare.isRushHour ? 'bg-[#0E1E14] border-[#22C55E]' : 'bg-[#0D1812] border-[#1B3322]'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${fare.isRushHour ? 'text-[#4ADE80]' : 'text-[#94A3B8]'} shrink-0`} />
                <span className="font-bold text-white">3. Delivery Time &amp; Rush Hour</span>
                {fare.isRushHour ? (
                  <span className="badge badge-blue text-[10px]">
                    Rush Hour Multiplier ({fare.rushHourMultiplier}x)
                  </span>
                ) : (
                  <span className="badge badge-basil text-[10px]">
                    Standard Off-Peak (1.0x)
                  </span>
                )}
              </div>
              <span className="font-extrabold text-[#4ADE80]">
                {breakdown.rushHourSurcharge > 0 ? `+₹${Math.round(breakdown.rushHourSurcharge)}` : '₹0'}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] pl-6 leading-relaxed">
              {fare.rushHourLabel}. Traffic congestion incentives ensure delivery partners accept and prioritize rescue pickups without food spoiling.
            </p>
          </div>

          {/* 4. Amount of Food */}
          <div className="p-3.5 rounded-2xl border border-[#1B3322] bg-[#0D1812] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#4ADE80] shrink-0" />
                <span className="font-bold text-white">4. Quantity of Food ({fare.weightKg} kg)</span>
              </div>
              <span className="font-extrabold text-[#4ADE80]">
                {breakdown.foodHandlingCharge > 0 ? `+₹${Math.round(breakdown.foodHandlingCharge)}` : 'Included'}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] pl-6 leading-relaxed">
              {breakdown.foodHandlingLabel}. Drivers receive handling compensation for lifting, securing, and offloading heavy insulated thermal crates.
            </p>
          </div>
        </div>

        {/* Itemized Transparent Ledger */}
        <div className="mt-5 pt-4 border-t border-[#1B3322] space-y-2 text-xs">
          <div className="flex justify-between text-[#94A3B8]">
            <span>Driver Direct Earnings (100% to Delivery Partner)</span>
            <span className="font-bold text-white">₹{Math.round(fare.driverEarningsInr)}</span>
          </div>
          <div className="flex justify-between text-[#94A3B8]">
            <span>Platform Support Fee (10% Cargo Insurance &amp; OTP security)</span>
            <span className="font-bold text-white">₹{Math.round(fare.serviceFeeInr)}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-[#1B3322] font-display">
            <span>Total Declared Delivery Fare (Billed to NGO Wallet)</span>
            <span className="text-[#4ADE80]">₹{Math.round(fare.totalAmountInr)}</span>
          </div>
        </div>

        {/* Good Samaritan Escrow Notice */}
        <div className="mt-5 p-3.5 rounded-2xl bg-[#0D1812] text-white text-[11px] flex items-center gap-3 border border-[#22C55E]/40 shadow-dark-highlight">
          <ShieldCheck className="w-5 h-5 text-[#4ADE80] shrink-0" />
          <span className="leading-relaxed text-[#CBD5E1]">
            <strong className="text-[#86EFAC]">Zero Price Gouging Guarantee:</strong> Delivery fare is escrowed from your NGO wallet upon reservation and released to the driver only after verified OTP physical handover.
          </span>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-3 border-t border-[#1B3322] flex items-center justify-end">
          <button
            onClick={onClose}
            className="btn-terra px-6 py-2.5 text-xs font-bold btn-press shadow-glow-apple"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  </Portal>
);
}
