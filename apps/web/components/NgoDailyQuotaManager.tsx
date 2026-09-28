'use client';

import React, { useState, useEffect } from 'react';
import {
  Sunrise,
  Sun,
  Moon,
  Zap,
  Sliders,
  Bell,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Truck,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Scale,
  Info
} from 'lucide-react';
import { api } from '../lib/api';
import FareBreakdownModal from './FareBreakdownModal';
import Portal from './Portal';
import { calculateDeclaredDeliveryAmount, DeclaredDeliveryFare } from '../lib/pricing';
import { liveSync } from '../lib/sync';

interface Props {
  onRefreshParent?: () => void;
  activeEntityName?: string;
  donations?: any[];
}

export default function NgoDailyQuotaManager({ onRefreshParent, activeEntityName, donations = [] }: Props) {
  const [quotasData, setQuotasData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRadarList, setShowRadarList] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [selectedFareBreakdown, setSelectedFareBreakdown] = useState<{
    fare: DeclaredDeliveryFare;
    orderTitle: string;
    donorName: string;
  } | null>(null);

  // Config modal state
  const [configForm, setConfigForm] = useState({
    breakfast_target_kg: 25,
    breakfast_beneficiaries: 50,
    lunch_target_kg: 50,
    lunch_beneficiaries: 100,
    dinner_target_kg: 60,
    dinner_beneficiaries: 120,
    receiving_address: 'Dharavi Welfare Hub, Near Sion Station, Mumbai',
    max_radius_km: 25,
  });

  const loadQuotaAndAlerts = async () => {
    try {
      const [quotasRes, alertsRes] = await Promise.all([
        api.getDailyMealQuotas(),
        api.getAiProximityAlerts(),
      ]);

      if (quotasRes) {
        setQuotasData(quotasRes);
        setConfigForm({
          breakfast_target_kg: quotasRes.slots.BREAKFAST.target_kg,
          breakfast_beneficiaries: quotasRes.slots.BREAKFAST.beneficiaries_count,
          lunch_target_kg: quotasRes.slots.LUNCH.target_kg,
          lunch_beneficiaries: quotasRes.slots.LUNCH.beneficiaries_count,
          dinner_target_kg: quotasRes.slots.DINNER.target_kg,
          dinner_beneficiaries: quotasRes.slots.DINNER.beneficiaries_count,
          receiving_address: quotasRes.receiving_address,
          max_radius_km: 25,
        });
      }

      if (alertsRes) {
        setAlerts(alertsRes);
      }
    } catch (e) {
      console.error('Failed to load NGO quotas or alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotaAndAlerts();
    const interval = setInterval(loadQuotaAndAlerts, 2500);
    const unsubscribe = liveSync.subscribe((msg) => {
      if (msg.type === 'DONATION_POSTED' || msg.type === 'QUOTA_CLAIMED' || msg.type === 'JOB_RESERVED') {
        loadQuotaAndAlerts();
      }
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [donations]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.updateDailyMealQuotas(configForm);
      setQuotasData(res);
      setShowConfigModal(false);
      setActionSuccessMsg('Daily 3-meal targets updated and synced with AI Proximity Matcher.');
      await loadQuotaAndAlerts();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      console.error('Config update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAlert = async (alert: any) => {
    setClaimingId(alert.donation_id);
    setActionSuccessMsg('');
    try {
      const res = await api.claimDonationForMealSlot(
        alert.matched_slot,
        alert.donation_id,
        alert.available_quantity_kg
      );

      if (res && res.quotas) {
        setQuotasData(res.quotas);
      }

      setActionSuccessMsg(
        `🎉 Successfully claimed ${alert.available_quantity_kg} kg from ${alert.donor_name} for ${alert.matched_slot} quota! Delivery job created.`
      );

      // Dismiss this alert
      setDismissedAlerts((prev) => [...prev, alert.donation_id]);
      await loadQuotaAndAlerts();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      console.error('Claim error:', err);
    } finally {
      setClaimingId(null);
    }
  };

  if (loading && !quotasData) {
    return (
      <div className="card-organic p-8 flex items-center justify-center gap-3 text-sm text-[#94A3B8] py-12 bg-[#08120B] border border-[#1B3322]">
        <RefreshCw className="w-5 h-5 animate-spin text-[#4ADE80]" />
        <span className="font-medium text-white">Syncing daily 3-meal feeding quotas &amp; proximity radar...</span>
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => !dismissedAlerts.includes(a.donation_id));
  const primaryAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;

  const slots = quotasData?.slots || {
    BREAKFAST: {
      slot: 'BREAKFAST',
      label: 'Morning Breakfast',
      time_window: '07:00 - 10:30',
      target_kg: 25,
      fulfilled_kg: 10,
      remaining_kg: 15,
      beneficiaries_count: 50,
      status: 'DEFICIT',
    },
    LUNCH: {
      slot: 'LUNCH',
      label: 'Afternoon Lunch',
      time_window: '11:30 - 15:30',
      target_kg: 50,
      fulfilled_kg: 20,
      remaining_kg: 30,
      beneficiaries_count: 100,
      status: 'ACTIVE_WINDOW',
    },
    DINNER: {
      slot: 'DINNER',
      label: 'Evening Dinner',
      time_window: '18:30 - 22:30',
      target_kg: 60,
      fulfilled_kg: 15,
      remaining_kg: 45,
      beneficiaries_count: 120,
      status: 'DEFICIT',
    },
  };

  return (
    <div className="space-y-4">
      {/* Action Success Toast */}
      {actionSuccessMsg && (
        <div className="alert-success flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] shrink-0" />
            <span className="font-semibold text-xs sm:text-sm">{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg('')}
            className="text-[#4ADE80] hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🤖 High-Priority AI Proximity Push Notification Banner */}
      {primaryAlert && (
        <div className="bg-gradient-to-r from-[#060D08] via-[#0A1810] to-[#050C07] rounded-3xl p-5 sm:p-6 text-white shadow-2xl border-2 border-[#22C55E]/50 relative overflow-hidden animate-in slide-in-from-top-3 duration-300 grain-bg">
          <div className="absolute right-0 top-0 w-80 h-80 bg-[#4ADE80]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#22C55E] to-[#4ADE80] text-[#031408] flex items-center justify-center shadow-[0_0_20px_rgba(52,199,89,0.4)] font-black shrink-0 animate-pulse">
                <Bell className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-basil text-[10px]">
                    <Sparkles className="w-3 h-3 text-[#4ADE80]" />
                    <span>AI Proximity Match Detected</span>
                  </span>

                  <span className="badge badge-blue text-[10px]">
                    📍 {primaryAlert.distance_km} km away (~{primaryAlert.estimated_duration_min}m transit)
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/10 text-apple-300 border border-apple-500/30">
                    Matches {primaryAlert.matched_slot} Need
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white leading-tight font-display">
                  {primaryAlert.headline}
                </h3>

                <p className="text-xs text-[#CBD5E1] leading-relaxed max-w-2xl font-normal">
                  {primaryAlert.description}{' '}
                  <span className="text-[#86EFAC] font-semibold">
                    (Category: {primaryAlert.food_category.replace('_', ' ')} • {primaryAlert.is_veg ? '🌱 Pure Veg' : '🍗 Non-Veg'})
                  </span>
                </p>

                {/* Declared Delivery Fare Strip */}
                {(() => {
                  const alertFare = calculateDeclaredDeliveryAmount({
                    distanceKm: Number(primaryAlert.distance_km) || 3.5,
                    weightKg: Number(primaryAlert.available_quantity_kg) || 20.0,
                  });
                  return (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <div className="px-3 py-1 rounded-xl bg-black/50 text-[#4ADE80] border border-[#22C55E]/40 font-extrabold flex items-center gap-1.5 shadow-sm">
                        <Truck className="w-3.5 h-3.5 text-[#34C759]" />
                        <span>Declared Delivery Fare: ₹{Math.round(alertFare.totalAmountInr)}</span>
                      </div>
                      <span className="text-[#94A3B8]">
                        via {alertFare.vehicleName} • {alertFare.isRushHour ? `🔥 Rush Hour (${alertFare.rushHourMultiplier}x)` : '⚡ Off-Peak'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFareBreakdown({
                            fare: alertFare,
                            orderTitle: primaryAlert.donation_title,
                            donorName: primaryAlert.donor_name,
                          })
                        }
                        className="text-[#86EFAC] hover:text-white underline font-bold text-[11px] ml-1 flex items-center gap-1 btn-press"
                      >
                        <Info className="w-3 h-3" />
                        <span>View Fare Breakdown</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
              <button
                onClick={() => handleClaimAlert(primaryAlert)}
                disabled={claimingId === primaryAlert.donation_id}
                className="btn-terra px-5 py-3 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg hover:shadow-xl btn-press disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>
                  {claimingId === primaryAlert.donation_id
                    ? 'Claiming & Dispatching...'
                    : `⚡ Claim for ${primaryAlert.matched_slot}`}
                </span>
              </button>

              <button
                onClick={() => setDismissedAlerts((prev) => [...prev, primaryAlert.donation_id])}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#CBD5E1] border border-white/20 text-xs transition btn-press"
                title="Dismiss this notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Quotas Dashboard Card */}
      <div className="card-organic p-6 sm:p-7 space-y-6 grain-bg">
        {/* Title Bar & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2E8D9]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#22C55E] animate-pulse" />
              <h2 className="text-xl font-extrabold text-[#0F172A] font-display">
                Daily 3-Meal Demand Quotas &amp; Deficit Radar
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Fixed daily community nutrition targets for Breakfast, Lunch &amp; Dinner. AI continuously compares local restaurant surpluses to your remaining deficit.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowRadarList(!showRadarList)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#CBD5E1] transition flex items-center gap-1.5 btn-press"
            >
              <Truck className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Proximity Radar ({activeAlerts.length})</span>
              {showRadarList ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
            </button>

            <button
              onClick={() => setShowConfigModal(true)}
              className="btn-terra px-4 py-2 text-xs font-bold shadow-xs flex items-center gap-1.5 btn-press"
            >
              <Sliders className="w-3.5 h-3.5 text-[#031408]" />
              <span>Configure Meal Targets</span>
            </button>
          </div>
        </div>

        {/* Aggregate Daily Summary Bar (Dark Highlighted Box) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B150F] p-4 rounded-2xl border border-[#22C55E]/35 text-xs shadow-inner">
          <div>
            <span className="text-[#94A3B8] block text-[10px] font-bold uppercase tracking-wider">Total Daily Target</span>
            <span className="text-lg font-black text-white font-display">
              {quotasData?.total_target_kg || 135} kg{' '}
              <span className="text-[11px] font-normal text-[#94A3B8]">
                (~{((quotasData?.total_target_kg || 135) * 2)} meals)
              </span>
            </span>
          </div>

          <div>
            <span className="text-[#94A3B8] block text-[10px] font-bold uppercase tracking-wider">Fulfilled Today</span>
            <span className="text-lg font-black text-[#34C759] font-display">
              {quotasData?.total_fulfilled_kg || 45} kg{' '}
              <span className="text-[11px] font-normal text-[#86EFAC]">
                ({Math.round(((quotasData?.total_fulfilled_kg || 45) / (quotasData?.total_target_kg || 135)) * 100)}%)
              </span>
            </span>
          </div>

          <div>
            <span className="text-[#94A3B8] block text-[10px] font-bold uppercase tracking-wider">Remaining Deficit</span>
            <span className="text-lg font-black text-[#A3E635] font-display">
              {quotasData?.total_remaining_kg || 90} kg{' '}
              <span className="text-[11px] font-normal text-[#86EFAC]">needed</span>
            </span>
          </div>

          <div>
            <span className="text-[#94A3B8] block text-[10px] font-bold uppercase tracking-wider">Receiving Hub Location</span>
            <span className="text-xs font-bold text-white truncate block mt-1" title={quotasData?.receiving_address}>
              📍 {quotasData?.receiving_address?.slice(0, 24) || 'Dharavi Hub'}...
            </span>
          </div>
        </div>

        {/* 3 Feeding Cycle Cards: Breakfast, Lunch, Dinner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. BREAKFAST */}
          <div
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              quotasData?.active_slot === 'BREAKFAST'
                ? 'bg-[#0E1E14] border-[#22C55E] ring-2 ring-[#4ADE80]/40 shadow-glow-apple'
                : 'bg-[#0B150F] border-[#1B3322] hover:border-[#22C55E]/60 shadow-dark-highlight'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#162D1F] text-[#4ADE80] border border-[#22C55E]/30 flex items-center justify-center font-bold">
                    <Sunrise className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white font-display">{slots.BREAKFAST.label}</h3>
                    <p className="text-[10px] text-[#94A3B8] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {slots.BREAKFAST.time_window}
                    </p>
                  </div>
                </div>

                {quotasData?.active_slot === 'BREAKFAST' && (
                  <span className="badge badge-blue text-[9px] animate-pulse">
                    Active Window
                  </span>
                )}
              </div>

              {/* Progress and Numbers */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8] font-medium">Fulfilled vs Target:</span>
                  <span className="font-extrabold text-white">
                    {slots.BREAKFAST.fulfilled_kg} / {slots.BREAKFAST.target_kg} kg
                  </span>
                </div>

                {/* Progress bar */}
                {(() => {
                  const pct = Math.min(100, Math.round((slots.BREAKFAST.fulfilled_kg / slots.BREAKFAST.target_kg) * 100));
                  return (
                    <div className="w-full bg-[#1E293B] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#22C55E] to-[#4ADE80] h-2.5 rounded-full transition-all duration-500 shadow-glow-apple"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-[#94A3B8]">{slots.BREAKFAST.beneficiaries_count} Beneficiaries</span>
                  <span className={`font-bold ${slots.BREAKFAST.remaining_kg <= 0 ? 'text-[#86EFAC]' : 'text-[#4ADE80]'}`}>
                    {slots.BREAKFAST.remaining_kg <= 0
                      ? '✓ Target Met'
                      : `Deficit: ${slots.BREAKFAST.remaining_kg} kg needed`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1B3322] flex items-center justify-between text-[11px]">
              <span className="text-[#94A3B8]">Grains, Poha, Milk, Bread</span>
              <button
                onClick={() => setShowConfigModal(true)}
                className="font-bold text-[#4ADE80] hover:text-[#86EFAC] hover:underline btn-press"
              >
                Adjust Quota →
              </button>
            </div>
          </div>

          {/* 2. LUNCH */}
          <div
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              quotasData?.active_slot === 'LUNCH'
                ? 'bg-[#0E1E14] border-[#22C55E] ring-2 ring-[#4ADE80]/40 shadow-glow-apple'
                : 'bg-[#0B150F] border-[#1B3322] hover:border-[#22C55E]/60 shadow-dark-highlight'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#162D1F] text-[#4ADE80] border border-[#22C55E]/30 flex items-center justify-center font-bold">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white font-display">{slots.LUNCH.label}</h3>
                    <p className="text-[10px] text-[#94A3B8] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {slots.LUNCH.time_window}
                    </p>
                  </div>
                </div>

                {quotasData?.active_slot === 'LUNCH' && (
                  <span className="badge badge-basil text-[9px] animate-pulse">
                    Active Window
                  </span>
                )}
              </div>

              {/* Progress and Numbers */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8] font-medium">Fulfilled vs Target:</span>
                  <span className="font-extrabold text-white">
                    {slots.LUNCH.fulfilled_kg} / {slots.LUNCH.target_kg} kg
                  </span>
                </div>

                {/* Progress bar */}
                {(() => {
                  const pct = Math.min(100, Math.round((slots.LUNCH.fulfilled_kg / slots.LUNCH.target_kg) * 100));
                  return (
                    <div className="w-full bg-[#1E293B] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] h-2.5 rounded-full transition-all duration-500 shadow-glow-apple"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-[#94A3B8]">{slots.LUNCH.beneficiaries_count} Beneficiaries</span>
                  <span className={`font-bold ${slots.LUNCH.remaining_kg <= 0 ? 'text-[#86EFAC]' : 'text-[#4ADE80]'}`}>
                    {slots.LUNCH.remaining_kg <= 0
                      ? '✓ Target Met'
                      : `Deficit: ${slots.LUNCH.remaining_kg} kg needed`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1B3322] flex items-center justify-between text-[11px]">
              <span className="text-[#94A3B8]">Cooked Meals, Dal, Rice</span>
              <button
                onClick={() => setShowConfigModal(true)}
                className="font-bold text-[#4ADE80] hover:text-[#86EFAC] hover:underline btn-press"
              >
                Adjust Quota →
              </button>
            </div>
          </div>

          {/* 3. DINNER */}
          <div
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              quotasData?.active_slot === 'DINNER'
                ? 'bg-[#0E1E14] border-[#22C55E] ring-2 ring-[#4ADE80]/40 shadow-glow-apple'
                : 'bg-[#0B150F] border-[#1B3322] hover:border-[#22C55E]/60 shadow-dark-highlight'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#162D1F] text-[#4ADE80] border border-[#22C55E]/30 flex items-center justify-center font-bold">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white font-display">{slots.DINNER.label}</h3>
                    <p className="text-[10px] text-[#94A3B8] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {slots.DINNER.time_window}
                    </p>
                  </div>
                </div>

                {quotasData?.active_slot === 'DINNER' && (
                  <span className="badge badge-terra text-[9px] animate-pulse">
                    Active Window
                  </span>
                )}
              </div>

              {/* Progress and Numbers */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8] font-medium">Fulfilled vs Target:</span>
                  <span className="font-extrabold text-white">
                    {slots.DINNER.fulfilled_kg} / {slots.DINNER.target_kg} kg
                  </span>
                </div>

                {/* Progress bar */}
                {(() => {
                  const pct = Math.min(100, Math.round((slots.DINNER.fulfilled_kg / slots.DINNER.target_kg) * 100));
                  return (
                    <div className="w-full bg-[#1E293B] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#22C55E] to-[#A3E635] h-2.5 rounded-full transition-all duration-500 shadow-glow-apple"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-[#94A3B8]">{slots.DINNER.beneficiaries_count} Beneficiaries</span>
                  <span className={`font-bold ${slots.DINNER.remaining_kg <= 0 ? 'text-[#86EFAC]' : 'text-[#4ADE80]'}`}>
                    {slots.DINNER.remaining_kg <= 0
                      ? '✓ Target Met'
                      : `Deficit: ${slots.DINNER.remaining_kg} kg needed`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1B3322] flex items-center justify-between text-[11px]">
              <span className="text-[#94A3B8]">Warm Dinner, Banquet Food</span>
              <button
                onClick={() => setShowConfigModal(true)}
                className="font-bold text-[#4ADE80] hover:text-[#86EFAC] hover:underline btn-press"
              >
                Adjust Quota →
              </button>
            </div>
          </div>
        </div>

        {/* AI Proximity Radar Accordion */}
        {showRadarList && (
          <div className="mt-4 p-5 rounded-2xl bg-[#08120B] border border-[#1B3322] space-y-3 animate-in fade-in duration-200 shadow-dark-highlight">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 font-display">
                <Truck className="w-4 h-4 text-[#4ADE80]" />
                <span>Nearby Restaurant Surplus Radar (Compared to Remaining Deficits)</span>
              </h4>
              <span className="text-[11px] text-[#94A3B8]">Search radius: 25 km max</span>
            </div>

            {activeAlerts.length === 0 ? (
              <p className="text-xs text-[#94A3B8] py-3 text-center">
                No active restaurant surplus posts within 25 km currently match your remaining deficit.
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeAlerts.map((alt) => {
                  const altFare = calculateDeclaredDeliveryAmount({
                    distanceKm: Number(alt.distance_km) || 3.5,
                    weightKg: Number(alt.available_quantity_kg) || 20.0,
                  });

                  return (
                    <div
                      key={alt.donation_id}
                      className="p-3.5 rounded-xl bg-[#0D1812] border border-[#1B3322] hover:border-[#22C55E] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white font-display">{alt.donor_name}</span>
                          <span className="badge badge-basil text-[10px]">
                            {alt.available_quantity_kg} kg
                          </span>
                          <span className="text-[#94A3B8]">• {alt.distance_km} km away</span>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#162D1F] text-[#4ADE80] border border-[#22C55E]/40">
                            🚚 Fare: ₹{Math.round(altFare.totalAmountInr)} ({altFare.vehicleClass})
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedFareBreakdown({
                                fare: altFare,
                                orderTitle: alt.donation_title,
                                donorName: alt.donor_name,
                              })
                            }
                            className="text-[#4ADE80] hover:underline font-bold text-[10px] flex items-center gap-0.5 ml-1 btn-press"
                          >
                            <Info className="w-3 h-3 text-[#4ADE80]" />
                            <span>Breakdown</span>
                          </button>
                        </div>
                        <p className="text-[#94A3B8]">{alt.donation_title}</p>
                        <p className="text-[11px] text-[#4ADE80] font-semibold">
                          Matches {alt.matched_slot} • Fulfills {alt.fulfillment_percentage}% of your remaining deficit ({alt.slot_remaining_need_kg} kg needed)
                        </p>
                      </div>

                      <button
                        onClick={() => handleClaimAlert(alt)}
                        disabled={claimingId === alt.donation_id}
                        className="btn-terra px-4 py-2 text-xs font-bold shadow-glow-apple flex items-center gap-1.5 shrink-0 self-start sm:self-auto disabled:opacity-50 btn-press"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{claimingId === alt.donation_id ? 'Claiming...' : `Claim for ${alt.matched_slot}`}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Configure 3-Meal Quotas Modal */}
      {showConfigModal && (
        <Portal>
          <div className="modal-overlay">
          <div className="modal-panel relative max-w-lg w-full p-6 sm:p-7 overflow-hidden max-h-[92vh] overflow-y-auto bg-[#08120B] border border-[#1B3322] shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-[#1B3322]">
              <div>
                <span className="badge badge-basil text-xs">
                  NGO Target Settings
                </span>
                <h3 className="text-xl font-black text-white mt-1 font-display">
                  Configure Fixed 3-Time Meal Targets
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 text-[#94A3B8] hover:text-white rounded-xl hover:bg-[#162D1F] transition btn-press"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 my-4 text-xs">
              {/* 1. Breakfast Target */}
              <div className="p-3.5 rounded-2xl bg-[#0D1812] border border-[#1B3322] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#4ADE80] flex items-center gap-1.5 font-display">
                    <Sunrise className="w-4 h-4 text-[#4ADE80]" />
                    <span>1. Breakfast Target (Morning: 07:00 - 10:30)</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94A3B8] block mb-1">Target Quantity (kg)</label>
                    <input
                      type="number"
                      min="5"
                      max="500"
                      value={configForm.breakfast_target_kg}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, breakfast_target_kg: Number(e.target.value) })
                      }
                      className="input-warm text-xs font-bold py-2 bg-[#060D09] border-[#1B3322] text-white focus:border-[#22C55E]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94A3B8] block mb-1">Beneficiaries Count</label>
                    <input
                      type="number"
                      min="1"
                      max="2000"
                      value={configForm.breakfast_beneficiaries}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, breakfast_beneficiaries: Number(e.target.value) })
                      }
                      className="input-warm text-xs py-2 bg-[#060D09] border-[#1B3322] text-white focus:border-[#22C55E]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Lunch Target */}
              <div className="p-3.5 rounded-2xl bg-[#0D1812] border border-[#1B3322] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#4ADE80] flex items-center gap-1.5 font-display">
                    <Sun className="w-4 h-4 text-[#4ADE80]" />
                    <span>2. Lunch Target (Afternoon: 11:30 - 15:30)</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94A3B8] block mb-1">Target Quantity (kg)</label>
                    <input
                      type="number"
                      min="5"
                      max="1000"
                      value={configForm.lunch_target_kg}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, lunch_target_kg: Number(e.target.value) })
                      }
                      className="input-warm text-xs font-bold py-2 bg-[#060D09] border-[#1B3322] text-white focus:border-[#22C55E]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94A3B8] block mb-1">Beneficiaries Count</label>
                    <input
                      type="number"
                      min="1"
                      max="2000"
                      value={configForm.lunch_beneficiaries}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, lunch_beneficiaries: Number(e.target.value) })
                      }
                      className="input-warm text-xs py-2 bg-[#060D09] border-[#1B3322] text-white focus:border-[#22C55E]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Dinner Target */}
              <div className="p-3.5 rounded-2xl bg-[#0D1812] border border-[#1B3322] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#4ADE80] flex items-center gap-1.5 font-display">
                    <Moon className="w-4 h-4 text-[#4ADE80]" />
                    <span>3. Dinner Target (Evening: 18:30 - 22:30)</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94A3B8] block mb-1">Target Quantity (kg)</label>
                    <input
                      type="number"
                      min="5"
                      max="1000"
                      value={configForm.dinner_target_kg}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, dinner_target_kg: Number(e.target.value) })
                      }
                      className="input-warm text-xs font-bold py-2 bg-[#060D09] border-[#1B3322] text-white focus:border-[#22C55E]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94A3B8] block mb-1">Beneficiaries Count</label>
                    <input
                      type="number"
                      min="1"
                      max="2000"
                      value={configForm.dinner_beneficiaries}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, dinner_beneficiaries: Number(e.target.value) })
                      }
                      className="input-warm text-xs py-2 bg-[#060D09] border-[#1B3322] text-white focus:border-[#22C55E]"
                    />
                  </div>
                </div>
              </div>

              {/* Receiving Hub Address */}
              <div>
                <label className="font-bold text-white block mb-1 font-display">NGO Receiving Hub Address</label>
                <input
                  type="text"
                  required
                  value={configForm.receiving_address}
                  onChange={(e) => setConfigForm({ ...configForm, receiving_address: e.target.value })}
                  className="input-warm text-xs py-2.5 bg-[#060D09] border-[#1B3322] text-white focus:border-[#22C55E]"
                  placeholder="e.g. Dharavi Welfare Hub, Near Sion Station, Mumbai"
                />
              </div>

              <div className="pt-3 border-t border-[#1B3322] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:bg-[#162D1F] hover:text-white btn-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-terra px-5 py-2.5 text-xs font-bold shadow-glow-apple btn-press"
                >
                  Save &amp; Sync 3-Meal Targets
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    )}
      {/* Transparent Declared Delivery Fare Breakdown Modal */}
      <FareBreakdownModal
        isOpen={!!selectedFareBreakdown}
        onClose={() => setSelectedFareBreakdown(null)}
        fare={selectedFareBreakdown?.fare || null}
        orderTitle={selectedFareBreakdown?.orderTitle}
        donorName={selectedFareBreakdown?.donorName}
      />
    </div>
  );
}
