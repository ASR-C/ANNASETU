'use client';

import React, { useState, useEffect } from 'react';
import {
  Utensils,
  PlusCircle,
  Clock,
  CheckCircle,
  FileText,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Download,
  Calendar,
  MapPin,
  ChevronRight,
  TrendingUp,
  BadgeCheck,
  FileCheck,
  Crown,
  Zap,
  CreditCard,
  Layers,
  ArrowRight,
  Leaf,
  Droplets,
  Award
} from 'lucide-react';
import { api } from '../lib/api';
import VerificationModal from './VerificationModal';
import SubscriptionModal from './SubscriptionModal';
import Portal from './Portal';

interface Props {
  donations: any[];
  impactStats: any;
  onRefresh: () => void;
  onOpenCertificate: (jobId: string) => void;
  activeEntityName?: string;
}

export type DonorTab = 'batches' | 'post' | 'impact' | 'subscription' | 'kyc';

export default function DonorView({
  donations,
  impactStats,
  onRefresh,
  onOpenCertificate,
  activeEntityName,
}: Props) {
  const [activeTab, setActiveTab] = useState<DonorTab>('batches');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showVerifModal, setShowVerifModal] = useState(false);

  // Subscription state
  const [subscriptionTier, setSubscriptionTier] = useState<'STARTER' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [subscriptionCycle, setSubscriptionCycle] = useState<'monthly' | 'annual'>('monthly');

  // Load saved subscription from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSub = localStorage.getItem('annasetu_restaurant_subscription');
      if (savedSub) {
        try {
          const parsed = JSON.parse(savedSub);
          if (parsed.tier) setSubscriptionTier(parsed.tier);
          if (parsed.cycle) setSubscriptionCycle(parsed.cycle);
        } catch (_) {}
      }
    }
  }, []);

  const handleSelectPlan = (tier: 'STARTER' | 'PRO' | 'ENTERPRISE', cycle: 'monthly' | 'annual') => {
    setSubscriptionTier(tier);
    setSubscriptionCycle(cycle);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'annasetu_restaurant_subscription',
        JSON.stringify({
          tier,
          cycle,
          updatedAt: new Date().toISOString(),
          status: 'ACTIVE',
        })
      );
    }
    setSuccessMsg(
      `Platform Plan updated to ${
        tier === 'PRO'
          ? 'Verified Restaurant Pro (₹1,499/mo)'
          : tier === 'ENTERPRISE'
          ? 'Enterprise Banquets (₹4,999/mo)'
          : 'Starter Free Tier'
      }.`
    );
  };

  const [activeVerif, setActiveVerif] = useState<any>({
    document_type: 'FSSAI_LICENSE',
    document_title: 'FSSAI License / Registration',
    document_number: '11521018000456',
    badge_text: 'FSSAI Safe Food Certified',
  });

  const [formData, setFormData] = useState({
    title: 'Surplus Lunch Buffet - Steamed Rice & Dal Makhani',
    food_category: 'COOKED_MEALS',
    is_veg: true,
    quantity_kg: 25.0,
    shelf_life_hours: 4,
    storage_condition: 'HEATED',
    pickup_address: 'Taj Grand Kitchens, Apollo Bunder, Colaba, Mumbai',
    latitude: 18.922,
    longitude: 72.8347,
    special_instructions: 'Packed in insulated stainless steel catering containers. Handle warm.',
    seal_number: `SEAL-${Math.floor(100000 + Math.random() * 900000)}`,
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAiAssist = async () => {
    if (!formData.title) return;
    setAiLoading(true);
    try {
      const res = await api.aiAssistDonation(formData.title, formData.special_instructions);
      setAiSuggestion(res);
      if (res.recommended_category) {
        setFormData((prev) => ({
          ...prev,
          food_category: res.recommended_category,
          is_veg: res.is_veg,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.quantity_kg < 5.0) {
      setErrorMsg('Minimum donation quantity is 5 kg. Smaller batches cannot be published.');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const deadline = new Date(now.getTime() + formData.shelf_life_hours * 3600 * 1000);

      await api.createDonation({
        title: formData.title,
        food_category: formData.food_category,
        is_veg: formData.is_veg,
        quantity_kg: Number(formData.quantity_kg),
        available_from: now.toISOString(),
        deadline: deadline.toISOString(),
        storage_condition: formData.storage_condition,
        pickup_address: formData.pickup_address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        special_instructions: formData.special_instructions,
        seal_number: formData.seal_number,
        images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'],
      });

      setSuccessMsg('Your surplus batch is live! Nearby NGOs and drivers have been notified.');
      setActiveTab('batches');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish donation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-float-up pb-12">
      {/* ── Page Header Banner (Soothing Deep Pine & Sage) ── */}
      <div className="hero-warm p-6 sm:p-7 text-parchment-50 shadow-warm-lg grain-bg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-basil">
                <CheckCircle className="w-3.5 h-3.5 text-apple-300" />
                <span>Verified Vendor</span>
              </span>
              <button
                onClick={() => setActiveTab('kyc')}
                className="text-xs px-3 py-0.5 rounded-full bg-basil-800/70 hover:bg-basil-700/80 text-parchment-200 border border-apple-400/30 transition flex items-center gap-1.5 btn-press"
              >
                <FileCheck className="w-3.5 h-3.5 text-saffron-300" />
                <span>{activeVerif.document_title}: {activeVerif.document_number}</span>
                <span className="text-[10px] text-saffron-300 underline ml-0.5">Edit</span>
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className="text-xs px-3 py-0.5 rounded-full bg-saffron-300/15 hover:bg-saffron-300/25 text-saffron-300 border border-saffron-300/35 transition flex items-center gap-1.5 font-bold btn-press"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Plan: {subscriptionTier === 'PRO' ? 'Pro' : subscriptionTier === 'ENTERPRISE' ? 'Enterprise' : 'Starter'}</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-parchment-50">
              {activeEntityName || 'Taj Grand Kitchens & Banquets'}
            </h1>
            <p className="text-xs sm:text-sm text-parchment-200/90 max-w-xl font-body">
              Turn commercial surplus into verified community meals with automated ESG receipts and Good Samaritan immunity.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('post')}
              className="btn-terra btn-press px-5 py-2.5 text-sm flex items-center gap-2 shadow-warm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Share Surplus Batch</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Pill Bar (Multi-Page Tabs) ── */}
      <div className="subnav-container">
        <button
          onClick={() => setActiveTab('batches')}
          className={`subnav-tab ${activeTab === 'batches' ? 'subnav-tab-active' : ''}`}
        >
          <Utensils className="w-4 h-4" />
          <span>Surplus Batches</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-parchment-200/70 text-clay-700 font-bold ml-1">
            {donations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('post')}
          className={`subnav-tab ${activeTab === 'post' ? 'subnav-tab-active' : ''}`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Share Surplus</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-apple-500/20 text-apple-600 font-bold ml-0.5">
            + New
          </span>
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`subnav-tab ${activeTab === 'impact' ? 'subnav-tab-active' : ''}`}
        >
          <FileText className="w-4 h-4" />
          <span>Impact & 80G Certificates</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`subnav-tab ${activeTab === 'subscription' ? 'subnav-tab-active' : ''}`}
        >
          <Crown className="w-4 h-4" />
          <span>Subscription Plan</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-saffron-300/30 text-amber-800 font-bold ml-0.5">
            {subscriptionTier}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`subnav-tab ${activeTab === 'kyc' ? 'subnav-tab-active' : ''}`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>KYC & Statutory Licenses</span>
          <span className="text-[10px] text-apple-600 font-bold">✓ Active</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="alert-success text-sm flex items-center justify-between gap-3 animate-float-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-apple-600 shrink-0" />
            <span className="font-semibold text-clay-800">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
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
          PAGE 1: SURPLUS BATCHES & ACTIVE RESCUES
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'batches' && (
        <div className="space-y-6 animate-float-in">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="card-organic p-4">
              <p className="text-xs text-clay-500 font-medium">Food Rescued</p>
              <p className="text-2xl font-display font-extrabold text-apple-600 mt-1">
                {impactStats?.total_food_rescued_kg || 1240} kg
              </p>
              <p className="text-[11px] text-apple-500 mt-0.5 flex items-center gap-1 font-body">
                <TrendingUp className="w-3 h-3" /> +18% this month
              </p>
            </div>
            <div className="card-organic p-4">
              <p className="text-xs text-clay-500 font-medium">Meals Supported</p>
              <p className="text-2xl font-display font-extrabold text-amber-700 mt-1">
                {impactStats?.total_meals_supported || 2480}
              </p>
              <p className="text-[11px] text-clay-400 mt-0.5 font-body">2 meals per kg standard</p>
            </div>
            <div className="card-organic p-4">
              <p className="text-xs text-clay-500 font-medium">CO₂ Prevented</p>
              <p className="text-2xl font-display font-extrabold text-apple-700 mt-1">
                {impactStats?.co2e_emissions_prevented_kg || 3100} kg
              </p>
              <p className="text-[11px] text-clay-400 mt-0.5 font-body">2.5x landfill factor</p>
            </div>
            <div className="card-organic p-4">
              <p className="text-xs text-clay-500 font-medium">Active Rescues</p>
              <p className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                {donations.filter((d) => d.status === 'RESERVED' || d.status === 'ALLOCATED').length || 2}
              </p>
              <p className="text-[11px] text-apple-600 mt-0.5 font-body">In-transit via GPS & OTP</p>
            </div>
          </div>

          {/* Batches Grid */}
          <div className="card-organic p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-clay-200 gap-3">
              <div>
                <h2 className="text-xl font-display font-bold text-clay-800">Your Surplus Batches</h2>
                <p className="text-xs text-clay-500 mt-0.5 font-body">
                  Batches posted from your kitchen, currently available or scheduled for rescue
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={onRefresh}
                  className="btn-ghost btn-press px-3.5 py-1.5 text-xs text-clay-600"
                >
                  Refresh Feed
                </button>
                <button
                  onClick={() => setActiveTab('post')}
                  className="btn-terra btn-press px-4 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Batch</span>
                </button>
              </div>
            </div>

            {donations.length === 0 ? (
              <div className="text-center py-14 border-2 border-dashed border-clay-200 rounded-organic mt-4">
                <Utensils className="w-10 h-10 text-clay-300 mx-auto mb-2.5" />
                <p className="text-base font-display font-bold text-clay-700">No active surplus batches right now</p>
                <p className="text-xs text-clay-500 mt-1 max-w-sm mx-auto font-body">
                  When you have surplus from a banquet or lunch service, share it here to trigger immediate delivery.
                </p>
                <button
                  onClick={() => setActiveTab('post')}
                  className="btn-terra btn-press mt-4 px-5 py-2 text-xs inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Share Your First Batch</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                {donations.map((d, idx) => {
                  const avail = Math.max(0, d.quantity_kg - (d.reserved_quantity_kg + d.allocated_quantity_kg));
                  return (
                    <div
                      key={d.id}
                      className={`card-organic card-organic-interactive p-5 flex flex-col justify-between animate-float-in stagger-${Math.min(idx + 1, 5)}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`badge text-[10px] ${
                                  d.is_veg ? 'badge-basil' : 'badge-terra'
                                }`}
                              >
                                {d.is_veg ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                              </span>
                              <span className="badge badge-clay text-[10px]">
                                {d.food_category?.replace('_', ' ')}
                              </span>
                              {subscriptionTier !== 'STARTER' && (
                                <span className="badge badge-saffron text-[10px]">
                                  <Zap className="w-2.5 h-2.5 fill-current" />
                                  <span>{subscriptionTier === 'ENTERPRISE' ? 'Fleet Priority' : 'Pro Priority'}</span>
                                </span>
                              )}
                            </div>
                            <h3 className="font-display font-bold text-base text-clay-800 mt-1.5">{d.title}</h3>
                          </div>
                          <span
                            className={`badge text-xs shrink-0 ${
                              d.status === 'AVAILABLE'
                                ? 'badge-basil'
                                : d.status === 'RESERVED'
                                ? 'badge-saffron'
                                : 'bg-apple-50 text-apple-700 border border-apple-300'
                            }`}
                          >
                            {d.status || 'AVAILABLE'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-parchment-100 rounded-organic-sm border border-clay-100 text-xs">
                          <div>
                            <span className="text-clay-400 block text-[10px] font-body">Total Batch</span>
                            <span className="font-bold text-clay-800">{d.quantity_kg} kg</span>
                          </div>
                          <div>
                            <span className="text-clay-400 block text-[10px] font-body">Available</span>
                            <span className="font-bold text-apple-600">{avail} kg</span>
                          </div>
                          <div>
                            <span className="text-clay-400 block text-[10px] font-body">Meals</span>
                            <span className="font-bold text-amber-700">{Math.round(d.quantity_kg * 2)}</span>
                          </div>
                        </div>

                        <div className="text-xs text-clay-500 space-y-1 font-body">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-clay-400 shrink-0" />
                            <span className="truncate">{d.pickup_address}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-clay-400 shrink-0" />
                            <span>
                              Deadline: {new Date(d.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </p>
                          {d.seal_number && (
                            <p className="flex items-center gap-1.5 text-apple-600 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Tamper Seal: {d.seal_number}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-clay-100 flex items-center justify-between">
                        <span className="text-[11px] text-clay-400 font-mono">
                          #{d.id.slice(0, 8)}
                        </span>
                        <button
                          onClick={() => onOpenCertificate(d.id)}
                          className="btn-ghost btn-press px-3 py-1.5 text-xs flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-apple-600" />
                          <span>Impact Certificate</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 2: SHARE SURPLUS BATCH (DEDICATED POSTING STATION)
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'post' && (
        <div className="card-organic p-6 sm:p-8 animate-float-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-clay-200 gap-3">
            <div>
              <span className="badge badge-terra text-xs">Dedicated Rescue Station</span>
              <h2 className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                Post New Surplus Batch
              </h2>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                Broadcasted instantly across all verified NGOs within radius. Dispatch scheduled upon reservation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('batches')}
              className="btn-ghost btn-press px-4 py-2 text-xs self-start sm:self-auto"
            >
              ← Back to Batches
            </button>
          </div>

          {/* Tier Feature Highlight Bar */}
          <div className="my-5 p-3.5 rounded-organic bg-parchment-100 border border-clay-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Crown className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-clay-800">
                  Active Tier: {subscriptionTier === 'PRO' ? 'Restaurant Pro' : subscriptionTier === 'ENTERPRISE' ? 'Enterprise Banquets' : 'Starter Free'}
                </span>
                <span className="text-clay-500 block sm:inline sm:ml-1.5">
                  {subscriptionTier === 'STARTER'
                    ? '• Standard matching. Upgrade for express driver dispatch.'
                    : '• Express driver dispatch & automatic ESG 80G tax receipt active.'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('subscription')}
              className="text-xs font-bold text-apple-600 hover:text-apple-700 underline shrink-0"
            >
              Manage Tier →
            </button>
          </div>

          <form onSubmit={handleCreateDonation} className="space-y-6">
            {/* Title & AI Auto-Tag */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-clay-700">Food Item Description / Menu Items</label>
                <button
                  type="button"
                  onClick={handleAiAssist}
                  disabled={aiLoading || !formData.title}
                  className="text-xs text-apple-600 font-semibold flex items-center gap-1.5 hover:text-apple-700 btn-press"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{aiLoading ? 'AI Analyzing...' : 'AI Assist Classification'}</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-warm text-sm"
                placeholder="e.g. Banquet Surplus: Paneer Makhani, Jeera Pulao, Chapati & Dal Tadka"
              />
              {aiSuggestion && (
                <p className="text-xs text-apple-600 mt-1 font-body flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  AI Suggested: {aiSuggestion.recommended_category} • {aiSuggestion.is_veg ? 'Pure Veg' : 'Non-Veg'}
                </p>
              )}
            </div>

            {/* Category & Dietary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-clay-700 block mb-1">Food Category</label>
                <select
                  value={formData.food_category}
                  onChange={(e) => setFormData({ ...formData, food_category: e.target.value })}
                  className="input-warm"
                >
                  <option value="COOKED_MEALS">Cooked Meals (Warm / Catering)</option>
                  <option value="BAKERY_GRAIN">Bakery & Grains</option>
                  <option value="FRESH_PRODUCE">Fresh Produce & Fruits</option>
                  <option value="DAIRY_PRODUCTS">Dairy & Cold Storage</option>
                  <option value="PACKAGED_GOODS">Sealed Packaged Groceries</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-clay-700 block mb-1">Dietary Classification</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_veg: true })}
                    className={`flex-1 py-2.5 rounded-organic-sm text-xs font-bold border transition btn-press ${
                      formData.is_veg
                        ? 'bg-apple-50 border-apple-500 text-apple-700 shadow-sm'
                        : 'bg-parchment-50 border-clay-200 text-clay-500'
                    }`}
                  >
                    🌱 Pure Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_veg: false })}
                    className={`flex-1 py-2.5 rounded-organic-sm text-xs font-bold border transition btn-press ${
                      !formData.is_veg
                        ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                        : 'bg-parchment-50 border-clay-200 text-clay-500'
                    }`}
                  >
                    🍗 Non-Veg
                  </button>
                </div>
              </div>
            </div>

            {/* Quantity & Shelf Life */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-clay-700">Batch Quantity (kg)</label>
                  <span className="badge badge-saffron text-[10px]">Min 5 kg</span>
                </div>
                <input
                  type="number"
                  min="5"
                  step="0.5"
                  required
                  value={formData.quantity_kg}
                  onChange={(e) => setFormData({ ...formData, quantity_kg: parseFloat(e.target.value) || 0 })}
                  className="input-warm font-bold"
                />
                <p className="text-[11px] text-clay-500 mt-1 font-body">
                  ≈ {Math.round(formData.quantity_kg * 2)} nutritious meals supported
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-clay-700 block mb-1">Safe Consumption Window</label>
                <select
                  value={formData.shelf_life_hours}
                  onChange={(e) => setFormData({ ...formData, shelf_life_hours: parseInt(e.target.value) })}
                  className="input-warm"
                >
                  <option value={3}>3 Hours (Immediate Rescue)</option>
                  <option value={4}>4 Hours (Standard Cooked Food)</option>
                  <option value={6}>6 Hours (Chilled / Insulated)</option>
                  <option value={12}>12 Hours (Cold Chain)</option>
                  <option value={24}>24 Hours (Bakery / Grains)</option>
                </select>
              </div>
            </div>

            {/* Pickup Location & Seal */}
            <div>
              <label className="text-xs font-bold text-clay-700 block mb-1">Kitchen Pickup Address</label>
              <input
                type="text"
                required
                value={formData.pickup_address}
                onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                className="input-warm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-clay-700 block mb-1">Tamper-Proof Seal Code</label>
                <input
                  type="text"
                  value={formData.seal_number}
                  onChange={(e) => setFormData({ ...formData, seal_number: e.target.value })}
                  className="input-warm font-mono font-bold bg-parchment-100"
                />
                <span className="text-[10px] text-clay-400 font-body">Affixed on physical container</span>
              </div>

              <div>
                <label className="text-xs font-bold text-clay-700 block mb-1">Storage Condition</label>
                <select
                  value={formData.storage_condition}
                  onChange={(e) => setFormData({ ...formData, storage_condition: e.target.value })}
                  className="input-warm"
                >
                  <option value="HEATED">Heated / Insulated Catering Box</option>
                  <option value="AMBIENT">Ambient Room Temperature</option>
                  <option value="REFRIGERATED">Refrigerated / Chill Box</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-clay-700 block mb-1">Special Handling Instructions</label>
              <textarea
                rows={2}
                value={formData.special_instructions}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                className="input-warm"
                placeholder="e.g. Packed in stainless steel containers. Please handle warm."
              />
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-clay-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('batches')}
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
                <span>{submitting ? 'Publishing Surplus...' : 'Publish Surplus Batch'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 3: IMPACT & CSR 80G TAX CERTIFICATES
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'impact' && (
        <div className="space-y-6 animate-float-in">
          <div className="card-organic p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-clay-200 gap-3">
              <div>
                <span className="badge badge-basil text-xs">Sustainability Studio</span>
                <h2 className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                  ESG & Tax Impact Reporting
                </h2>
                <p className="text-xs text-clay-500 mt-0.5 font-body">
                  Certified documentation valid for Section 80G tax deductions and CSR sustainability audits.
                </p>
              </div>
              <button
                onClick={() => onOpenCertificate(donations[0]?.id || 'demo-job-1')}
                className="btn-terra btn-press px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Sample 80G Dossier</span>
              </button>
            </div>

            {/* Environmental Equivalency Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              <div className="p-5 rounded-organic bg-parchment-100 border border-clay-200 space-y-1">
                <div className="w-8 h-8 rounded-full bg-apple-100 text-apple-600 flex items-center justify-center mb-2">
                  <Leaf className="w-4 h-4" />
                </div>
                <p className="text-xs text-clay-500 font-body">Landfill Diversion</p>
                <p className="text-2xl font-display font-extrabold text-clay-800">
                  {impactStats?.total_food_rescued_kg || 1240} kg
                </p>
                <p className="text-[11px] text-apple-600 font-body">Equivalent to 4.2 tons waste averted</p>
              </div>

              <div className="p-5 rounded-organic bg-parchment-100 border border-clay-200 space-y-1">
                <div className="w-8 h-8 rounded-full bg-apple-100 text-apple-600 flex items-center justify-center mb-2">
                  <Droplets className="w-4 h-4" />
                </div>
                <p className="text-xs text-clay-500 font-body">Virtual Water Saved</p>
                <p className="text-2xl font-display font-extrabold text-clay-800">
                  {((impactStats?.total_food_rescued_kg || 1240) * 154).toLocaleString()} L
                </p>
                <p className="text-[11px] text-apple-600 font-body">Calculated via agricultural lifecycle</p>
              </div>

              <div className="p-5 rounded-organic bg-parchment-100 border border-clay-200 space-y-1">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                  <Award className="w-4 h-4" />
                </div>
                <p className="text-xs text-clay-500 font-body">Verified Meal Count</p>
                <p className="text-2xl font-display font-extrabold text-clay-800">
                  {impactStats?.total_meals_supported || 2480} meals
                </p>
                <p className="text-[11px] text-amber-700 font-body">Delivered to shelters & community hubs</p>
              </div>
            </div>

            {/* Legal Immunity Assurance */}
            <div className="p-4 rounded-organic bg-apple-50/60 border border-apple-300/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-apple-700">
                <ShieldCheck className="w-4 h-4" />
                <span>Good Samaritan Legal Immunity Guaranteed</span>
              </div>
              <p className="text-clay-600 font-body leading-relaxed">
                Under the FSSAI Safe Food & Share Food Regulation (Clause 11.2) and the National Food Security Act,
                all registered donors acting in good faith are legally indemnified from civil or criminal liability.
              </p>
            </div>

            {/* List of Batch Certificates */}
            <div className="mt-8 space-y-3">
              <h3 className="text-base font-display font-bold text-clay-800">Available Batch Certificates</h3>
              <div className="divide-y divide-clay-100 border border-clay-200 rounded-organic overflow-hidden">
                {donations.map((d) => (
                  <div key={d.id} className="p-4 bg-white flex items-center justify-between gap-4 hover:bg-parchment-50 transition">
                    <div>
                      <p className="text-sm font-bold text-clay-800">{d.title}</p>
                      <p className="text-xs text-clay-500 font-body mt-0.5">
                        {d.quantity_kg} kg • #{d.id.slice(0, 8)} • Pickup: {d.pickup_address}
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenCertificate(d.id)}
                      className="btn-ghost btn-press px-3.5 py-1.5 text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5 text-apple-600" />
                      <span>View 80G Certificate</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 4: SUBSCRIPTION PLAN & MAINTENANCE
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'subscription' && (
        <div className="card-organic p-6 sm:p-8 animate-float-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-clay-200 gap-3">
            <div>
              <span className="badge badge-saffron text-xs">Platform Sustainability</span>
              <h2 className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                Vendor Subscription & Maintenance
              </h2>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                Supports continuous real-time dispatching, cold-chain GPS tracking, and automated ESG verification.
              </p>
            </div>
            {/* Cycle Toggle */}
            <div className="flex items-center gap-1 bg-parchment-200 p-1 rounded-organic-sm text-xs font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSubscriptionCycle('monthly')}
                className={`px-3 py-1.5 rounded transition ${
                  subscriptionCycle === 'monthly'
                    ? 'bg-white text-clay-800 shadow-sm'
                    : 'text-clay-500 hover:text-clay-700'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setSubscriptionCycle('annual')}
                className={`px-3 py-1.5 rounded transition flex items-center gap-1 ${
                  subscriptionCycle === 'annual'
                    ? 'bg-white text-clay-800 shadow-sm'
                    : 'text-clay-500 hover:text-clay-700'
                }`}
              >
                <span>Annual</span>
                <span className="badge badge-basil text-[9px] py-0 px-1">Save 20%</span>
              </button>
            </div>
          </div>

          {/* Pricing Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Starter */}
            <div
              className={`p-6 rounded-organic border flex flex-col justify-between transition ${
                subscriptionTier === 'STARTER'
                  ? 'border-apple-500 bg-apple-50/30 shadow-md ring-2 ring-apple-500/20'
                  : 'border-clay-200 bg-white hover:border-clay-300'
              }`}
            >
              <div className="space-y-3">
                <span className="badge badge-clay text-[10px]">Starter Community</span>
                <h3 className="text-xl font-display font-bold text-clay-800">Free Tier</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-black text-clay-800">₹0</span>
                  <span className="text-xs text-clay-500">/ month</span>
                </div>
                <p className="text-xs text-clay-500 font-body leading-relaxed">
                  For small local bakeries or cafes with occasional surplus food.
                </p>
                <ul className="space-y-2 text-xs text-clay-600 font-body pt-3 border-t border-clay-100">
                  <li className="flex items-center gap-2">✓ Up to 5 batches/month</li>
                  <li className="flex items-center gap-2">✓ Standard driver assignment</li>
                  <li className="flex items-center gap-2">✓ Basic donation history</li>
                  <li className="text-clay-400">✗ Automated ESG tax certificates</li>
                </ul>
              </div>
              <button
                onClick={() => handleSelectPlan('STARTER', subscriptionCycle)}
                className={`w-full mt-6 py-2.5 text-xs font-bold rounded-organic-sm transition btn-press ${
                  subscriptionTier === 'STARTER'
                    ? 'bg-clay-200 text-clay-700 cursor-default'
                    : 'btn-ghost'
                }`}
              >
                {subscriptionTier === 'STARTER' ? 'Current Active Tier' : 'Select Starter'}
              </button>
            </div>

            {/* 2. Restaurant Pro */}
            <div
              className={`p-6 rounded-organic border flex flex-col justify-between transition relative ${
                subscriptionTier === 'PRO'
                  ? 'border-apple-600 bg-apple-50/40 shadow-lg ring-2 ring-apple-600/30'
                  : 'border-clay-200 bg-white hover:border-apple-300'
              }`}
            >
              <span className="absolute -top-3 right-6 badge badge-basil text-[10px] font-extrabold shadow-sm">
                Most Popular
              </span>
              <div className="space-y-3">
                <span className="badge badge-basil text-[10px]">Commercial Kitchen</span>
                <h3 className="text-xl font-display font-bold text-clay-800">Restaurant Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-black text-apple-600">
                    ₹{subscriptionCycle === 'annual' ? '1,199' : '1,499'}
                  </span>
                  <span className="text-xs text-clay-500">/ month</span>
                </div>
                <p className="text-xs text-clay-500 font-body leading-relaxed">
                  For active restaurants, buffet kitchens, and high-volume caterers.
                </p>
                <ul className="space-y-2 text-xs text-clay-700 font-body pt-3 border-t border-clay-100">
                  <li className="flex items-center gap-2">✓ Unlimited surplus batch postings</li>
                  <li className="flex items-center gap-2 font-bold text-apple-700">✓ Priority express driver dispatch (&lt;15 min)</li>
                  <li className="flex items-center gap-2">✓ Automated ESG & 80G tax receipts</li>
                  <li className="flex items-center gap-2">✓ 24/7 AI food safety compliance</li>
                </ul>
              </div>
              <button
                onClick={() => handleSelectPlan('PRO', subscriptionCycle)}
                className={`w-full mt-6 py-2.5 text-xs font-bold rounded-organic-sm transition btn-press ${
                  subscriptionTier === 'PRO'
                    ? 'btn-terra'
                    : 'btn-terra'
                }`}
              >
                {subscriptionTier === 'PRO' ? 'Current Active Plan' : 'Upgrade to Pro'}
              </button>
            </div>

            {/* 3. Enterprise Banquets */}
            <div
              className={`p-6 rounded-organic border flex flex-col justify-between transition ${
                subscriptionTier === 'ENTERPRISE'
                  ? 'border-amber-600 bg-amber-50/40 shadow-md ring-2 ring-amber-600/30'
                  : 'border-clay-200 bg-white hover:border-clay-300'
              }`}
            >
              <div className="space-y-3">
                <span className="badge badge-saffron text-[10px]">Hotel & Fleet</span>
                <h3 className="text-xl font-display font-bold text-clay-800">Enterprise Fleet</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-black text-amber-800">
                    ₹{subscriptionCycle === 'annual' ? '3,999' : '4,999'}
                  </span>
                  <span className="text-xs text-clay-500">/ month</span>
                </div>
                <p className="text-xs text-clay-500 font-body leading-relaxed">
                  For multi-property luxury hotel chains, convention centres and banquets.
                </p>
                <ul className="space-y-2 text-xs text-clay-600 font-body pt-3 border-t border-clay-100">
                  <li className="flex items-center gap-2">✓ Multi-kitchen branch management</li>
                  <li className="flex items-center gap-2">✓ Dedicated van fleet allocation</li>
                  <li className="flex items-center gap-2">✓ Custom CSR board presentation dossier</li>
                  <li className="flex items-center gap-2">✓ API webhooks for ERP/POS sync</li>
                </ul>
              </div>
              <button
                onClick={() => handleSelectPlan('ENTERPRISE', subscriptionCycle)}
                className={`w-full mt-6 py-2.5 text-xs font-bold rounded-organic-sm transition btn-press ${
                  subscriptionTier === 'ENTERPRISE'
                    ? 'bg-amber-700 text-white'
                    : 'btn-ghost'
                }`}
              >
                {subscriptionTier === 'ENTERPRISE' ? 'Current Active Tier' : 'Select Enterprise'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 5: VENDOR KYC & STATUTORY LICENSES
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'kyc' && (
        <div className="card-organic p-6 sm:p-8 animate-float-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-clay-200 gap-3">
            <div>
              <span className="badge badge-basil text-xs">Statutory Compliance</span>
              <h2 className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                Vendor KYC & Licensing Documents
              </h2>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                Verify your commercial license to ensure full regulatory immunity and donor authenticity.
              </p>
            </div>
            <button
              onClick={() => setShowVerifModal(true)}
              className="btn-terra btn-press px-4 py-2 text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <FileCheck className="w-4 h-4" />
              <span>Update Active Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'FSSAI_LICENSE',
                title: 'FSSAI License / Registration',
                hint: '14-Digit FoSCoS Certificate',
                status: 'VERIFIED',
                number: activeVerif.document_type === 'FSSAI_LICENSE' ? activeVerif.document_number : '11521018000456',
                authority: 'Food Safety and Standards Authority of India',
              },
              {
                id: 'GSTIN',
                title: 'GSTIN Registration',
                hint: '15-Character Business GSTIN',
                status: activeVerif.document_type === 'GSTIN' ? 'VERIFIED' : 'AVAILABLE',
                number: activeVerif.document_type === 'GSTIN' ? activeVerif.document_number : '27AABCT3421K1Z2',
                authority: 'Goods and Services Tax Network (GSTN)',
              },
              {
                id: 'TRADE_LICENSE',
                title: 'Trade / Shop & Establishment Act',
                hint: 'Municipal Authority Clearance',
                status: activeVerif.document_type === 'TRADE_LICENSE' ? 'VERIFIED' : 'AVAILABLE',
                number: activeVerif.document_type === 'TRADE_LICENSE' ? activeVerif.document_number : 'MH/BMC/EST/2021/8892',
                authority: 'Brihanmumbai Municipal Corporation (BMC)',
              },
              {
                id: 'FIRE_SAFETY_POLLUTION_NOC',
                title: 'Fire Safety & Pollution Control NOC',
                hint: 'Public Safety Clearance',
                status: activeVerif.document_type === 'FIRE_SAFETY_POLLUTION_NOC' ? 'VERIFIED' : 'AVAILABLE',
                number: activeVerif.document_type === 'FIRE_SAFETY_POLLUTION_NOC' ? activeVerif.document_number : 'NOC/FIRE/2023/1102',
                authority: 'Maharashtra Pollution Control Board & Fire Dept',
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
                      {isSelected ? '✓ Active on File' : 'Standby Document'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-parchment-100 border border-clay-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-clay-500 text-[11px]">Doc No:</span>
                    <span className="font-bold text-clay-800">{doc.number}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-apple-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Regulatory Immunity Active</span>
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
                        setSuccessMsg(`Active document set to: ${doc.title}`);
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

      {/* Statutory Vendor Verification Modal */}
      <VerificationModal
        isOpen={showVerifModal}
        onClose={() => setShowVerifModal(false)}
        role="DONOR"
        entityName={activeEntityName || 'Taj Grand Kitchens & Banquets'}
        currentDocType={activeVerif.document_type}
        currentDocNumber={activeVerif.document_number}
        onVerifiedSuccess={(data) => {
          setActiveVerif({
            document_type: data.document_type,
            document_title: data.document_title,
            document_number: data.document_number,
            badge_text: data.badge_text,
          });
          setSuccessMsg(`Vendor verification updated: ${data.document_title} (${data.document_number})`);
        }}
      />

      {/* Subscription Modal fallback */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentTier={subscriptionTier}
        onSelectPlan={handleSelectPlan}
        restaurantName={activeEntityName}
      />
    </div>
  );
}
