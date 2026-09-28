'use client';

import React, { useState } from 'react';
import {
  HeartHandshake,
  PlusCircle,
  Clock,
  MapPin,
  ShieldCheck,
  Wallet,
  Zap,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  BadgeCheck,
  FileCheck,
  Truck,
  Scale,
  Info,
  Sparkles,
  ShoppingBag,
  Sunrise,
  Layers,
  Building,
  KeyRound,
  Download
} from 'lucide-react';
import { api } from '../lib/api';
import WhyMatchModal from './WhyMatchModal';
import VerificationModal from './VerificationModal';
import NgoDailyQuotaManager from './NgoDailyQuotaManager';
import FareBreakdownModal from './FareBreakdownModal';
import { calculateDeclaredDeliveryAmount, DeclaredDeliveryFare } from '../lib/pricing';

interface Props {
  needs: any[];
  proposals: any[];
  wallet: any;
  deliveryJobs: any[];
  onRefresh: () => void;
  activeEntityName?: string;
  donations?: any[];
}

export type NgoTab = 'quotas' | 'feed' | 'proposals' | 'need' | 'deliveries' | 'wallet' | 'kyc';

export default function NgoView({
  needs,
  proposals,
  wallet,
  deliveryJobs,
  onRefresh,
  activeEntityName,
  donations = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<NgoTab>('quotas');
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [selectedFareBreakdown, setSelectedFareBreakdown] = useState<{
    fare: DeclaredDeliveryFare;
    orderTitle: string;
    donorName: string;
  } | null>(null);
  const [showVerifModal, setShowVerifModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(2500);

  const [activeVerif, setActiveVerif] = useState<any>({
    document_type: 'REGISTRATION_CERTIFICATE',
    document_title: 'Registration Certificate',
    document_number: 'MH/TRUST/2018/002341',
    badge_text: 'Trust Deed / MoA Registered',
  });

  const [needForm, setNeedForm] = useState({
    title: 'Community Dinner Meal Support - Dharavi Center',
    meal_period: 'DINNER',
    food_category: 'COOKED_MEALS',
    is_veg: true,
    required_quantity_kg: 20.0,
    minimum_acceptable_quantity_kg: 10.0,
    hours_from_now: 4,
    receiving_address: 'Dharavi Welfare Hub, Near Sion Station, Mumbai',
    latitude: 19.04,
    longitude: 72.855,
    special_requirements: 'Needs warm insulated containers. Beneficiary count: ~40 children and seniors.',
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const now = new Date();
      const requiredBy = new Date(now.getTime() + needForm.hours_from_now * 3600 * 1000);

      await api.createNeed({
        title: needForm.title,
        meal_period: needForm.meal_period,
        food_category: needForm.food_category,
        is_veg: needForm.is_veg,
        required_quantity_kg: Number(needForm.required_quantity_kg),
        minimum_acceptable_quantity_kg: Number(needForm.minimum_acceptable_quantity_kg),
        required_by: requiredBy.toISOString(),
        receiving_address: needForm.receiving_address,
        latitude: needForm.latitude,
        longitude: needForm.longitude,
        special_requirements: needForm.special_requirements,
      });

      setActionMsg('Your community food need is live! The matching engine is searching compatible surplus nearby.');
      setActiveTab('proposals');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create need');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReserve = async (proposal: any) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.reserveAndAllocate({
        donation_id: proposal.donation_id,
        need_id: proposal.need_id,
        requested_quantity_kg: proposal.quantity_kg || 20.0,
      });

      setSelectedProposal(null);
      setActionMsg(`Food reserved! Escrow hold applied and a delivery partner is being dispatched.`);
      setActiveTab('deliveries');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reserve food');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.topupWallet('ngo-org-001', topupAmount);
      setActionMsg(`₹${topupAmount.toLocaleString()} CSR grant deposited into your logistics wallet.`);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectClaimDonation = async (donation: any) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const activeNeed = needs.find((n) => n.status === 'ACTIVE') || needs[0];
      if (activeNeed) {
        await api.reserveAndAllocate({
          donation_id: donation.id,
          need_id: activeNeed.id,
          requested_quantity_kg: Math.min(Number(donation.quantity_kg) || 20, Number(activeNeed.required_quantity_kg) || 20),
        });
      } else {
        await api.claimDonationForMealSlot('LUNCH', donation.id, Number(donation.quantity_kg) || 20);
      }
      setActionMsg(`Success! Reserved ${donation.quantity_kg} kg from "${donation.donor_name || 'Donor'}". Delivery partner dispatched.`);
      setActiveTab('deliveries');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to claim surplus batch');
    } finally {
      setSubmitting(false);
    }
  };

  const activeDeliveriesCount = deliveryJobs.filter((j) => j.status !== 'DELIVERED').length;
  const availableSurplusCount = donations.filter((d) => d.status === 'AVAILABLE' || !d.status).length;
  const availableBalance = (wallet?.balance_inr || 15000) - (wallet?.reserved_inr || 0);

  return (
    <div className="space-y-6 animate-float-up pb-12">
      {/* ── Page Header Banner ── */}
      <div className="hero-warm p-6 sm:p-7 text-parchment-50 shadow-warm-lg grain-bg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-basil">
                <CheckCircle className="w-3.5 h-3.5 text-apple-300" />
                <span>Verified NGO Beneficiary</span>
              </span>
              <button
                onClick={() => setActiveTab('kyc')}
                className="text-xs px-3 py-0.5 rounded-full bg-basil-800/70 hover:bg-basil-700/80 text-parchment-200 border border-apple-400/30 transition flex items-center gap-1.5 btn-press"
              >
                <FileCheck className="w-3.5 h-3.5 text-saffron-300" />
                <span>{activeVerif.document_title}: {activeVerif.document_number}</span>
                <span className="text-[10px] text-saffron-300 underline ml-0.5">Switch</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-parchment-50">
              {activeEntityName || 'Mumbai Roti & Annadaan Foundation'}
            </h1>
            <p className="text-xs sm:text-sm text-parchment-200/90 max-w-xl font-body">
              Receive surplus food matching your meal quotas with GPS delivery, transparent declared fares, and audit tracking.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('wallet')}
              className="btn-ghost btn-press px-4 py-2.5 text-xs flex items-center gap-2 border-apple-400/40 text-parchment-100 hover:text-saffron-300"
            >
              <CreditCard className="w-4 h-4 text-saffron-300" />
              <span>Wallet: ₹{availableBalance.toLocaleString()}</span>
            </button>
            <button
              onClick={() => setActiveTab('need')}
              className="btn-terra btn-press px-5 py-2.5 text-sm flex items-center gap-2 shadow-warm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Request Food Support</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Pill Bar (Multi-Page Tabs) ── */}
      <div className="subnav-container">
        <button
          onClick={() => setActiveTab('quotas')}
          className={`subnav-tab ${activeTab === 'quotas' ? 'subnav-tab-active' : ''}`}
        >
          <Sunrise className="w-4 h-4" />
          <span>3-Meal Quotas & Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          className={`subnav-tab ${activeTab === 'feed' ? 'subnav-tab-active' : ''}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Surplus Feed</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-apple-500/20 text-apple-600 font-bold ml-1">
            {availableSurplusCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`subnav-tab ${activeTab === 'proposals' ? 'subnav-tab-active' : ''}`}
        >
          <Zap className="w-4 h-4" />
          <span>Ranked Matches</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 font-bold ml-1">
            {proposals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('need')}
          className={`subnav-tab ${activeTab === 'need' ? 'subnav-tab-active' : ''}`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Food Need</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-apple-500/20 text-apple-600 font-bold ml-0.5">
            + New
          </span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`subnav-tab ${activeTab === 'deliveries' ? 'subnav-tab-active' : ''}`}
        >
          <Truck className="w-4 h-4" />
          <span>Deliveries & OTP</span>
          {activeDeliveriesCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-apple-600 text-white font-extrabold ml-1 animate-pulse">
              {activeDeliveriesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`subnav-tab ${activeTab === 'wallet' ? 'subnav-tab-active' : ''}`}
        >
          <Wallet className="w-4 h-4" />
          <span>Wallet & Escrow</span>
          <span className="text-[10px] text-amber-800 font-bold ml-0.5">
            ₹{availableBalance.toLocaleString()}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`subnav-tab ${activeTab === 'kyc' ? 'subnav-tab-active' : ''}`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>Statutory 12A/80G</span>
          <span className="text-[10px] text-apple-600 font-bold">✓ Verified</span>
        </button>
      </div>

      {/* Action Messages */}
      {actionMsg && (
        <div className="alert-success text-sm flex items-center justify-between gap-3 animate-float-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-apple-600 shrink-0" />
            <span className="font-semibold text-clay-800">{actionMsg}</span>
          </div>
          <button
            onClick={() => setActionMsg('')}
            className="text-xs font-bold text-clay-500 hover:text-clay-800"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="alert-error text-sm flex items-center justify-between gap-3 animate-float-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-brick-500 shrink-0" />
            <span className="font-semibold text-brick-700">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg('')}
            className="text-xs font-bold text-brick-500 hover:text-brick-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 1: 3-MEAL FEEDING QUOTAS & AI PROXIMITY RADAR
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'quotas' && (
        <div className="space-y-6 animate-float-in">
          <NgoDailyQuotaManager
            onRefreshParent={onRefresh}
            activeEntityName={activeEntityName}
            donations={donations}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 2: LIVE SURPLUS FEED (DIRECT CLAIM & DECLARED FARES)
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'feed' && (
        <div className="card-organic p-6 animate-float-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-clay-200 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-apple-500 animate-pulse" />
                <h2 className="text-xl font-display font-bold text-clay-800">
                  Live Available Food Surplus Feed
                </h2>
                <span className="badge badge-basil text-[10px]">Real-Time Sync</span>
              </div>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                Broadcasted live when donors post surplus. Claiming automatically schedules a delivery partner rescue.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-clay-700 bg-parchment-200/80 px-3 py-1 rounded-full border border-clay-200">
                {availableSurplusCount} Active Batches
              </span>
              <button
                onClick={onRefresh}
                className="btn-ghost btn-press px-3.5 py-1.5 text-xs text-clay-600"
              >
                Refresh Feed
              </button>
            </div>
          </div>

          {availableSurplusCount === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-clay-200 rounded-organic mt-5">
              <Sparkles className="w-10 h-10 text-clay-300 mx-auto mb-2" />
              <p className="text-base font-display font-bold text-clay-700">All current surplus batches are claimed</p>
              <p className="text-xs text-clay-500 mt-1 max-w-sm mx-auto font-body">
                New batches appear here in real-time as restaurant donors post surplus. Check back shortly!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {donations
                .filter((d) => d.status === 'AVAILABLE' || !d.status)
                .map((d, idx) => {
                  const dist = 3.5;
                  const weight = Number(d.quantity_kg) || 20.0;
                  const fare = calculateDeclaredDeliveryAmount({
                    distanceKm: dist,
                    weightKg: weight,
                  });

                  return (
                    <div
                      key={d.id}
                      className={`card-organic card-organic-interactive p-5 flex flex-col justify-between space-y-4 animate-float-in stagger-${Math.min(idx + 1, 5)}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="badge badge-basil text-[10px]">
                                {d.food_category?.replace('_', ' ') || 'Cooked Meals'}
                              </span>
                              <span className={`badge ${d.is_veg ? 'badge-basil' : 'badge-saffron'} text-[10px]`}>
                                {d.is_veg ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                              </span>
                              {d.storage_condition && (
                                <span className="text-[10px] font-bold text-clay-500 bg-parchment-200 px-2 py-0.5 rounded">
                                  {d.storage_condition}
                                </span>
                              )}
                            </div>
                            <h3 className="font-display font-extrabold text-base text-clay-800 mt-1.5 leading-snug">
                              {d.title}
                            </h3>
                            <p className="text-xs text-clay-600 font-semibold font-body mt-0.5">
                              By {d.donor_name || 'Verified Kitchen'}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-lg font-display font-black text-apple-600 block">
                              {d.quantity_kg} kg
                            </span>
                            <span className="text-[10px] text-clay-400 font-body">
                              ~{Math.round(Number(d.quantity_kg) * 2)} meals
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-clay-600 font-body">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-apple-500 shrink-0" />
                            <span className="truncate">Pickup: {d.pickup_address || 'Apollo Bunder, Colaba'}</span>
                          </p>
                          {d.special_instructions && (
                            <p className="text-[11px] text-clay-500 italic pl-5 line-clamp-1">
                              "{d.special_instructions}"
                            </p>
                          )}
                        </div>

                        {/* Declared Delivery Fare Banner */}
                        <div className="p-3 rounded-organic bg-dark-850 text-parchment-50 border border-apple-400/25 flex items-center justify-between gap-3 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-saffron-300">
                              <Truck className="w-3.5 h-3.5" />
                              <span>Delivery Fare: ₹{Math.round(fare.totalAmountInr)}</span>
                            </div>
                            <p className="text-[10px] text-parchment-300 font-body">
                              {fare.vehicleName} • {fare.isRushHour ? 'Rush Hour' : 'Off-Peak'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedFareBreakdown({
                                fare,
                                orderTitle: d.title,
                                donorName: d.donor_name || 'Donor Partner',
                              })
                            }
                            className="btn-ghost btn-press px-2.5 py-1 text-[10px] font-extrabold flex items-center gap-1 shrink-0 border-apple-400/40 text-saffron-300 hover:bg-saffron-300/10"
                          >
                            <Info className="w-3 h-3" />
                            <span>Breakdown</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-clay-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-apple-600 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Ready for Pickup
                        </span>
                        <button
                          onClick={() => handleDirectClaimDonation(d)}
                          disabled={submitting}
                          className="btn-terra btn-press px-4 py-2 text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
                          <span>Direct Claim &amp; Dispatch</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 3: RANKED FOOD PROPOSALS (PRIORITY SCORES)
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'proposals' && (
        <div className="card-organic p-6 animate-float-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-clay-200 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-apple-600 animate-pulse" />
                <h2 className="text-xl font-display font-bold text-clay-800">
                  Ranked Food Proposals
                </h2>
              </div>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                Algorithmic compatibility matches scored by proximity, freshness, and meal period.
              </p>
            </div>
            <button
              onClick={onRefresh}
              className="btn-ghost btn-press px-3.5 py-1.5 text-xs text-clay-600"
            >
              Refresh Matches
            </button>
          </div>

          {proposals.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-clay-200 rounded-organic mt-5">
              <HeartHandshake className="w-10 h-10 text-clay-300 mx-auto mb-2" />
              <p className="text-base font-display font-bold text-clay-700">No active proposal matches right now</p>
              <p className="text-xs text-clay-500 mt-1 max-w-sm mx-auto font-body">
                Post your community meal needs to allow the matching engine to find the closest donor batches.
              </p>
              <button
                onClick={() => setActiveTab('need')}
                className="btn-terra btn-press mt-4 px-5 py-2 text-xs inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Food Need</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {proposals.map((prop, idx) => {
                const fare = calculateDeclaredDeliveryAmount({
                  distanceKm: Number(prop.distance_km) || 3.5,
                  weightKg: Number(prop.quantity_kg) || 20.0,
                });

                return (
                  <div
                    key={prop.id}
                    className={`card-organic card-organic-interactive p-5 flex flex-col justify-between space-y-4 animate-float-in stagger-${Math.min(idx + 1, 5)}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="badge badge-basil text-[10px]">Compatible Match</span>
                          <h3 className="font-display font-extrabold text-base text-clay-800 mt-1">
                            {prop.donation_title || 'Surplus Cooked Meals'}
                          </h3>
                          <p className="text-xs text-clay-500 font-body">For: {prop.need_title || 'Community Dinner'}</p>
                        </div>
                        {/* Priority Score */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 bg-dark-850 text-parchment-50 px-3 py-1 rounded-organic-sm shadow-sm border border-apple-400/20">
                            <Zap className="w-3.5 h-3.5 text-saffron-300" />
                            <span className="text-base font-display font-extrabold text-saffron-300">
                              {Math.round(prop.score)}
                            </span>
                            <span className="text-[10px] text-parchment-300">/100</span>
                          </div>
                          <span className="text-[10px] text-clay-400 block mt-0.5 font-body">Priority Score</span>
                        </div>
                      </div>

                      {/* Delivery Fare Banner */}
                      <div className="p-3.5 rounded-organic bg-dark-850 text-parchment-50 border border-apple-400/25 flex items-center justify-between gap-3 shadow-sm">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-saffron-300">
                            <Truck className="w-3.5 h-3.5" />
                            <span>Declared Delivery Fare</span>
                            {fare.isRushHour ? (
                              <span className="badge badge-saffron text-[9px] py-0 px-1.5">Rush Hour</span>
                            ) : (
                              <span className="badge badge-basil text-[9px] py-0 px-1.5">Off-Peak</span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-display font-extrabold text-white">
                              ₹{Math.round(fare.totalAmountInr)}
                            </span>
                            <span className="text-[11px] text-parchment-300 truncate font-body">({fare.vehicleName})</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFareBreakdown({
                              fare,
                              orderTitle: prop.donation_title || 'Surplus Food Batch',
                              donorName: prop.donor_name || 'Restaurant Partner',
                            })
                          }
                          className="btn-ghost btn-press px-3 py-1.5 text-[11px] font-extrabold flex items-center gap-1 shrink-0 border-apple-400/40 text-saffron-300 hover:border-saffron-300 hover:bg-saffron-300/10"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Breakdown</span>
                        </button>
                      </div>

                      {/* 4 Pricing Factors */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded-organic-sm bg-parchment-100 border border-clay-100 flex flex-col">
                          <span className="text-[10px] text-clay-400 font-body">1. Distance</span>
                          <span className="font-bold text-clay-800 flex items-center gap-1 mt-0.5 text-[11px]">
                            <MapPin className="w-3 h-3 text-apple-500" />
                            {fare.distanceKm} km
                          </span>
                        </div>
                        <div className="p-2 rounded-organic-sm bg-parchment-100 border border-clay-100 flex flex-col">
                          <span className="text-[10px] text-clay-400 font-body">2. Vehicle</span>
                          <span className="font-bold text-clay-800 flex items-center gap-1 mt-0.5 text-[11px]">
                            <Truck className="w-3 h-3 text-apple-600" />
                            {fare.vehicleClass}
                          </span>
                        </div>
                        <div className="p-2 rounded-organic-sm bg-parchment-100 border border-clay-100 flex flex-col">
                          <span className="text-[10px] text-clay-400 font-body">3. Time & Rush</span>
                          <span className={`font-bold flex items-center gap-1 mt-0.5 text-[11px] ${fare.isRushHour ? 'text-amber-700' : 'text-apple-600'}`}>
                            <Clock className="w-3 h-3" />
                            {fare.isRushHour ? `${fare.rushHourMultiplier}x Rush` : 'Off-Peak'}
                          </span>
                        </div>
                        <div className="p-2 rounded-organic-sm bg-parchment-100 border border-clay-100 flex flex-col">
                          <span className="text-[10px] text-clay-400 font-body">4. Food Weight</span>
                          <span className="font-bold text-clay-800 flex items-center gap-1 mt-0.5 text-[11px]">
                            <Scale className="w-3 h-3 text-amber-700" />
                            {fare.weightKg} kg
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-clay-600 line-clamp-2 font-body">
                        {prop.explanation || 'Fits current meal period, within receiving hours, nearby location, deadline compatible.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-clay-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedProposal(prop)}
                        className="text-xs font-semibold text-apple-700 hover:text-apple-800 flex items-center gap-1 btn-press"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Why this match?</span>
                      </button>
                      <button
                        onClick={() => handleReserve(prop)}
                        disabled={submitting}
                        className="btn-terra btn-press px-4 py-2 text-xs flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
                        <span>Reserve & Hold ₹{Math.round(fare.totalAmountInr)}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 4: POST FOOD NEED (DEDICATED STATION)
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'need' && (
        <div className="card-organic p-6 sm:p-8 animate-float-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-clay-200 gap-3">
            <div>
              <span className="badge badge-basil text-xs">Beneficiary Quota Request</span>
              <h2 className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                Post Community Food Need
              </h2>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                Specify feeding target, meal slot, and dietary preferences for your community center.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('quotas')}
              className="btn-ghost btn-press px-4 py-2 text-xs self-start sm:self-auto font-bold"
            >
              ← Back to Quotas
            </button>
          </div>

          <form onSubmit={handleCreateNeed} className="space-y-6 my-4">
            <div>
              <label className="text-xs font-bold text-clay-700 block mb-1">Need Title / Description</label>
              <input
                type="text"
                required
                value={needForm.title}
                onChange={(e) => setNeedForm({ ...needForm, title: e.target.value })}
                className="input-warm text-sm"
                placeholder="e.g. Evening Community Dinner Support - Dharavi Center"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-clay-700 block mb-1">Meal Period Slot</label>
                <select
                  value={needForm.meal_period}
                  onChange={(e) => setNeedForm({ ...needForm, meal_period: e.target.value })}
                  className="input-warm"
                >
                  <option value="BREAKFAST">Breakfast (07:00 - 10:30)</option>
                  <option value="LUNCH">Lunch (12:00 - 15:30)</option>
                  <option value="DINNER">Dinner (19:00 - 22:30)</option>
                  <option value="OTHER">Emergency Relief / Night Shelter</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-clay-700 block mb-1">Dietary Requirement</label>
                <select
                  value={needForm.is_veg ? 'true' : 'false'}
                  onChange={(e) => setNeedForm({ ...needForm, is_veg: e.target.value === 'true' })}
                  className="input-warm"
                >
                  <option value="true">Pure Vegetarian Only</option>
                  <option value="false">Vegetarian or Non-Veg</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-clay-700">Quantity Needed (kg)</label>
                  <span className="badge badge-saffron text-[10px]">Min 5 kg</span>
                </div>
                <input
                  type="number"
                  min="5"
                  required
                  value={needForm.required_quantity_kg}
                  onChange={(e) =>
                    setNeedForm({ ...needForm, required_quantity_kg: parseFloat(e.target.value) || 0 })
                  }
                  className="input-warm font-bold"
                />
                <p className="text-[11px] text-clay-500 mt-1 font-body">
                  ≈ {Math.round(needForm.required_quantity_kg * 2)} beneficiaries supported
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-clay-700 block mb-1">Min Acceptable Batch (kg)</label>
                <input
                  type="number"
                  min="5"
                  required
                  value={needForm.minimum_acceptable_quantity_kg}
                  onChange={(e) =>
                    setNeedForm({
                      ...needForm,
                      minimum_acceptable_quantity_kg: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="input-warm"
                />
                <p className="text-[11px] text-clay-500 mt-1 font-body">Accept partial deliveries</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-clay-700 block mb-1">Receiving Delivery Address</label>
              <input
                type="text"
                required
                value={needForm.receiving_address}
                onChange={(e) => setNeedForm({ ...needForm, receiving_address: e.target.value })}
                className="input-warm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-clay-700 block mb-1">Special Requirements & Beneficiary Info</label>
              <textarea
                rows={2}
                value={needForm.special_requirements}
                onChange={(e) => setNeedForm({ ...needForm, special_requirements: e.target.value })}
                className="input-warm"
                placeholder="e.g. Needs warm insulated containers. Beneficiary count: ~40 children and seniors."
              />
            </div>

            <div className="pt-4 border-t border-clay-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('quotas')}
                className="btn-ghost btn-press px-5 py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-terra btn-press px-6 py-2.5 text-sm flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? 'Publishing Need...' : 'Publish Food Need'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 5: ACTIVE DELIVERIES & RECEIVING OTP HANDOVER
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'deliveries' && (
        <div className="card-organic p-6 sm:p-8 animate-float-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-clay-200 gap-3">
            <div>
              <span className="badge badge-basil text-xs">Live Chain of Custody</span>
              <h2 className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                Incoming Rescues &amp; Receiving OTPs
              </h2>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                Share the 6-digit Receiving OTP with the driver upon physical delivery handoff.
              </p>
            </div>
            <button
              onClick={onRefresh}
              className="btn-ghost btn-press px-3.5 py-1.5 text-xs text-clay-600 self-start sm:self-auto"
            >
              Refresh Status
            </button>
          </div>

          {deliveryJobs.filter((j) => j.status !== 'DELIVERED').length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-clay-200 rounded-organic">
              <Truck className="w-10 h-10 text-clay-300 mx-auto mb-2" />
              <p className="text-base font-display font-bold text-clay-700">No incoming deliveries right now</p>
              <p className="text-xs text-clay-500 mt-1 max-w-sm mx-auto font-body">
                When you reserve a surplus batch or a proposal, the assigned driver's live GPS mission and Receiving OTP will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveryJobs
                .filter((j) => j.status !== 'DELIVERED')
                .map((job) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-organic border border-apple-300 bg-apple-50/20 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge bg-apple-600 text-white font-extrabold text-[10px]">
                          {job.status}
                        </span>
                        <span className="text-xs text-clay-500 font-mono">#{job.id.slice(0, 8)}</span>
                        <span className="badge badge-saffron text-[10px]">
                          Tamper Seal Verified
                        </span>
                      </div>
                      <p className="text-base font-display font-bold text-clay-800">
                        {job.total_quantity_kg} kg from {job.donor_name}
                      </p>
                      <p className="text-xs text-clay-600 flex items-center gap-1.5 font-body">
                        <MapPin className="w-3.5 h-3.5 text-apple-500" />
                        <span>Destination: {job.drop_address}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-5 bg-white p-4 rounded-organic border border-clay-200 shadow-sm shrink-0">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-clay-400 block font-body">
                          Receiving OTP
                        </span>
                        <span className="text-2xl font-mono font-black text-apple-700 tracking-wider">
                          {job.delivery_otp || '654321'}
                        </span>
                        <span className="text-[10px] text-clay-400 block font-body mt-0.5">
                          Give to driver upon delivery
                        </span>
                      </div>
                      <div className="border-l border-clay-200 pl-4 space-y-0.5">
                        <span className="text-[10px] text-clay-400 block font-body">Assigned Partner</span>
                        <span className="text-xs font-bold text-clay-800 block">
                          {job.driver_name || 'Ramesh Kumar'}
                        </span>
                        <span className="text-[11px] text-apple-600 font-semibold block">
                          Van • GPS Connected
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 6: LOGISTICS WALLET & ESCROW
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'wallet' && (
        <div className="card-organic p-6 sm:p-8 animate-float-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-clay-200 gap-3">
            <div>
              <span className="badge badge-saffron text-xs">Logistics Escrow Account</span>
              <h2 className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                NGO Logistics Escrow &amp; Grants
              </h2>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                Covers delivery partner fares transparently with zero markup. Backed by institutional CSR grants.
              </p>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-organic bg-parchment-100 border border-clay-200">
              <span className="text-xs text-clay-500 block font-body">Total Balance</span>
              <span className="text-2xl font-display font-black text-clay-800 mt-1 block">
                ₹{(wallet?.balance_inr || 15000).toLocaleString()}
              </span>
              <span className="text-[11px] text-clay-400 mt-0.5 block font-body">Cumulative funds on account</span>
            </div>

            <div className="p-5 rounded-organic bg-amber-50/50 border border-amber-300">
              <span className="text-xs text-amber-800 block font-body">Reserved in Escrow</span>
              <span className="text-2xl font-display font-black text-amber-900 mt-1 block">
                ₹{(wallet?.reserved_inr || 0).toLocaleString()}
              </span>
              <span className="text-[11px] text-amber-700 mt-0.5 block font-body">Held for active in-transit rescues</span>
            </div>

            <div className="p-5 rounded-organic bg-apple-50/50 border border-apple-300">
              <span className="text-xs text-apple-800 block font-body">Available for New Rescues</span>
              <span className="text-2xl font-display font-black text-apple-700 mt-1 block">
                ₹{availableBalance.toLocaleString()}
              </span>
              <span className="text-[11px] text-apple-600 mt-0.5 block font-body">Ready for instant dispatching</span>
            </div>
          </div>

          {/* CSR Grant Top-up Form */}
          <div className="p-6 rounded-organic border border-clay-200 bg-white space-y-4">
            <h3 className="text-base font-display font-bold text-clay-800">
              Deposit CSR Grant / Top-up Wallet
            </h3>
            <p className="text-xs text-clay-500 font-body">
              Simulate or allocate institutional CSR grants to replenish your logistics balance.
            </p>

            <form onSubmit={handleTopup} className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-bold text-clay-700 block mb-1">Grant Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-clay-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(parseInt(e.target.value) || 0)}
                    className="input-warm pl-8 font-bold text-base"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {[1000, 2500, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    className="btn-ghost btn-press flex-1 py-1.5 text-xs font-bold"
                  >
                    +₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-terra btn-press px-6 py-2.5 text-xs font-bold flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{submitting ? 'Depositing...' : `Deposit ₹${topupAmount.toLocaleString()} to Wallet`}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 7: STATUTORY KYC & 12A/80G TAX EXEMPTION
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'kyc' && (
        <div className="card-organic p-6 sm:p-8 animate-float-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-clay-200 gap-3">
            <div>
              <span className="badge badge-basil text-xs">Statutory Validation</span>
              <h2 className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                NGO Statutory Verification &amp; 12A/80G
              </h2>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                Statutory accreditation records required for tax exemption and government food security protocols.
              </p>
            </div>
            <button
              onClick={() => setShowVerifModal(true)}
              className="btn-terra btn-press px-4 py-2 text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <FileCheck className="w-4 h-4" />
              <span>Update KYC Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'REGISTRATION_CERTIFICATE',
                title: '1. Registration Certificate',
                hint: 'Trust Deed / MoA / Section 8 License',
                status: 'VERIFIED',
                number: activeVerif.document_type === 'REGISTRATION_CERTIFICATE' ? activeVerif.document_number : 'MH/TRUST/2018/002341',
                authority: 'Charity Commissioner / Ministry of Corporate Affairs',
              },
              {
                id: 'TAX_EXEMPTION_12A_80G',
                title: '2. 12A & 80G Tax Exemption',
                hint: 'Income Tax Department Sovereign Exemption',
                status: activeVerif.document_type === 'TAX_EXEMPTION_12A_80G' ? 'VERIFIED' : 'AVAILABLE',
                number: activeVerif.document_type === 'TAX_EXEMPTION_12A_80G' ? activeVerif.document_number : 'AAATM1234F20214',
                authority: 'Income Tax Department (Exemptions)',
              },
              {
                id: 'NGO_DARPAN',
                title: '3. NGO Darpan UID',
                hint: 'NITI Aayog Sovereign Registration',
                status: activeVerif.document_type === 'NGO_DARPAN' ? 'VERIFIED' : 'AVAILABLE',
                number: activeVerif.document_type === 'NGO_DARPAN' ? activeVerif.document_number : 'MH/2019/0231948',
                authority: 'NITI Aayog, Government of India',
              },
              {
                id: 'ORGANIZATION_PAN',
                title: '4. Institutional PAN',
                hint: 'Permanent Account Number Card',
                status: activeVerif.document_type === 'ORGANIZATION_PAN' ? 'VERIFIED' : 'AVAILABLE',
                number: activeVerif.document_type === 'ORGANIZATION_PAN' ? activeVerif.document_number : 'AAATM9988A',
                authority: 'Central Board of Direct Taxes (CBDT)',
              },
            ].map((doc) => {
              const isSelected = activeVerif.document_type === doc.id;
              return (
                <div
                  key={doc.id}
                  className={`p-5 rounded-organic border transition space-y-3 ${
                    isSelected
                      ? 'bg-apple-50/50 border-apple-500 shadow-sm'
                      : 'bg-white border-clay-200 hover:border-clay-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-clay-800 block">{doc.title}</span>
                      <span className="text-[11px] text-clay-400 font-body">{doc.authority}</span>
                    </div>
                    <span
                      className={`badge text-[10px] ${
                        isSelected ? 'badge-basil' : 'badge-clay'
                      }`}
                    >
                      {isSelected ? '✓ Active Document' : 'Standby Document'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-parchment-100 border border-clay-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-clay-500 text-[11px]">Doc No:</span>
                    <span className="font-bold text-clay-800">{doc.number}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-apple-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Statutory Good Samaritan Status</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveVerif({
                          document_type: doc.id,
                          document_title: doc.title,
                          document_number: doc.number,
                          badge_text: `${doc.title} Active`,
                        });
                        setActionMsg(`Active statutory document set to: ${doc.title}`);
                      }}
                      className="text-xs font-bold text-apple-600 hover:text-apple-700 underline"
                    >
                      {isSelected ? 'Currently Selected' : 'Set as Primary'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Why Match Modal */}
      {selectedProposal && (
        <WhyMatchModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
          onReserve={handleReserve}
        />
      )}

      {/* Statutory NGO Verification Modal */}
      <VerificationModal
        isOpen={showVerifModal}
        onClose={() => setShowVerifModal(false)}
        role="NGO"
        entityName={activeEntityName || 'Mumbai Roti & Annadaan Foundation'}
        currentDocType={activeVerif.document_type}
        currentDocNumber={activeVerif.document_number}
        onVerifiedSuccess={(data) => {
          setActiveVerif({
            document_type: data.document_type,
            document_title: data.document_title,
            document_number: data.document_number,
            badge_text: data.badge_text,
          });
          setActionMsg(`Verification updated: ${data.document_title} (${data.document_number})`);
        }}
      />

      {/* Fare Breakdown Modal */}
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
