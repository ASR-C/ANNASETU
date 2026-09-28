'use client';

import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Award,
  Zap,
  Camera,
  KeyRound,
  ArrowRight,
  TrendingUp,
  DollarSign,
  BadgeCheck,
  FileCheck,
  Compass,
  CreditCard,
  CheckCircle2,
  Navigation,
  Scale
} from 'lucide-react';
import { api } from '@/lib/api';
import VerificationModal from './VerificationModal';

interface Props {
  jobs: any[];
  onRefresh: () => void;
  activeEntityName?: string;
}

export type DriverTab = 'active' | 'available' | 'earnings' | 'profile';

export default function DriverView({ jobs, onRefresh, activeEntityName }: Props) {
  const [activeTab, setActiveTab] = useState<DriverTab>('active');
  const [submitting, setSubmitting] = useState(false);
  const [showVerifModal, setShowVerifModal] = useState(false);

  const [activeVerif, setActiveVerif] = useState<any>({
    document_type: 'VALID_DRIVING_LICENSE',
    document_title: 'Valid Driving License',
    document_number: 'MH0120150048291',
    badge_text: 'Commercial DL Verified',
  });

  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states for pickup / drop step verification
  const [pickupOtp, setPickupOtp] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [sealIntact, setSealIntact] = useState(true);

  const activeJob = jobs.find((j) => ['ON_JOB', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT'].includes(j.status));
  const availableJobs = jobs.filter((j) => j.status === 'AVAILABLE');

  const handleAcceptJob = async (jobId: string) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.acceptJob(jobId, 'driver-profile-001');
      setStatusMsg('Mission accepted! You are now assigned to this food rescue.');
      setActiveTab('active');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Job was already accepted by another driver partner.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPickup = async (jobId: string) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.verifyPickup(jobId, 'driver-profile-001', {
        otp: pickupOtp,
        latitude: 18.922,
        longitude: 72.8347,
        photo_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        seal_number: 'SEAL-VERIFIED-DONOR',
      });
      setStatusMsg('Pickup verified! Custody transferred. Head to destination.');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid Pickup OTP or failed verification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyDelivery = async (jobId: string) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.verifyDelivery(jobId, 'driver-profile-001', {
        otp: deliveryOtp,
        latitude: 19.04,
        longitude: 72.855,
        photo_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80',
        seal_intact: sealIntact,
      });
      setStatusMsg(`Mission complete! ₹${activeJob?.driver_earnings_inr || 500} settled to your earnings ledger.`);
      setActiveTab('earnings');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Delivery verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-float-up pb-12">
      {/* ── Page Header Banner ── */}
      <div className="hero-warm p-6 sm:p-7 text-parchment-50 shadow-warm-lg grain-bg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-basil">
                <CheckCircle className="w-3.5 h-3.5 text-apple-300" />
                <span>Verified Logistics Partner</span>
              </span>
              <button
                onClick={() => setActiveTab('profile')}
                className="text-xs px-3 py-0.5 rounded-full bg-basil-800/70 hover:bg-basil-700/80 text-parchment-200 border border-apple-400/30 transition flex items-center gap-1.5 btn-press"
              >
                <FileCheck className="w-3.5 h-3.5 text-saffron-300" />
                <span>{activeVerif.document_title}: {activeVerif.document_number}</span>
                <span className="text-[10px] text-saffron-300 underline ml-0.5">Switch</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-parchment-50">
              {activeEntityName || 'Ramesh Kumar'}
            </h1>
            <p className="text-xs sm:text-sm text-parchment-200/90 font-body">
              Commercial DL verified • Insulated van cargo • 4.95 ⭐ Rating • Zero-spillage certified
            </p>
          </div>

          <div className="flex items-center gap-3 bg-dark-850/80 px-4 py-2.5 rounded-organic border border-apple-400/30 shadow-sm shrink-0">
            <Award className="w-8 h-8 text-saffron-300 shrink-0" />
            <div>
              <p className="text-[10px] text-parchment-300 uppercase tracking-wider font-bold">Driver Rank</p>
              <p className="text-sm font-display font-extrabold text-white">Hunger Warrior Tier II</p>
              <p className="text-xs text-apple-300 font-body">28 rescues completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Pill Bar (Multi-Page Tabs) ── */}
      <div className="subnav-container">
        <button
          onClick={() => setActiveTab('active')}
          className={`subnav-tab ${activeTab === 'active' ? 'subnav-tab-active' : ''}`}
        >
          <Zap className="w-4 h-4" />
          <span>Active Mission</span>
          {activeJob ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-apple-600 text-white font-extrabold animate-pulse ml-0.5">
              In-Progress
            </span>
          ) : (
            <span className="text-[10px] text-clay-400 font-normal ml-0.5">Idle</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('available')}
          className={`subnav-tab ${activeTab === 'available' ? 'subnav-tab-active' : ''}`}
        >
          <Compass className="w-4 h-4" />
          <span>Available Rescues</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-apple-500/20 text-apple-600 font-bold ml-1">
            {availableJobs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`subnav-tab ${activeTab === 'earnings' ? 'subnav-tab-active' : ''}`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Earnings & Payouts</span>
          <span className="text-[10px] text-amber-800 font-bold ml-0.5">₹14,200</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`subnav-tab ${activeTab === 'profile' ? 'subnav-tab-active' : ''}`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>DL & Vehicle Profile</span>
          <span className="text-[10px] text-apple-600 font-bold">✓ Active</span>
        </button>
      </div>

      {/* Action Messages */}
      {statusMsg && (
        <div className="alert-success text-sm flex items-center justify-between gap-3 animate-float-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-apple-600 shrink-0" />
            <span className="font-semibold text-clay-800">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg('')} className="text-xs font-bold text-clay-500 hover:text-clay-800">
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
          <button onClick={() => setErrorMsg('')} className="text-xs font-bold text-brick-500 hover:text-brick-800">
            ✕
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 1: ACTIVE RESCUE MISSION STEPPER
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'active' && (
        <div className="space-y-6 animate-float-in">
          {activeJob ? (
            <div className="card-organic p-6 sm:p-8 border-2 border-apple-500 shadow-warm-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-clay-200 gap-3">
                <div>
                  <span className="badge badge-saffron text-xs">
                    Mission #{activeJob.id.slice(0, 8)}
                  </span>
                  <h2 className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                    Rescue {activeJob.total_quantity_kg} kg: {activeJob.donor_name} → {activeJob.ngo_name}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-clay-500 block font-body">Guaranteed Payout</span>
                  <span className="text-2xl font-display font-extrabold text-apple-600">
                    ₹{activeJob.driver_earnings_inr || 350}
                  </span>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="my-6">
                <div className="flex items-center justify-between text-xs font-bold text-clay-600 mb-2 font-body">
                  <span className={activeJob.status === 'ON_JOB' ? 'text-apple-600 font-extrabold' : ''}>
                    1. Arrive & Verify Pickup
                  </span>
                  <span className={activeJob.status === 'PICKED_UP' ? 'text-apple-600 font-extrabold' : ''}>
                    2. In-Transit GPS Delivery
                  </span>
                  <span className={activeJob.status === 'DELIVERED' ? 'text-apple-600 font-extrabold' : ''}>
                    3. NGO Handover & Settlement
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width:
                        activeJob.status === 'ON_JOB'
                          ? '33%'
                          : activeJob.status === 'PICKED_UP'
                          ? '66%'
                          : '100%',
                    }}
                  />
                </div>
              </div>

              {/* Route Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-organic bg-parchment-100 border border-clay-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-clay-400 block font-body">
                    Pickup Location
                  </span>
                  <p className="text-sm font-display font-bold text-clay-800">{activeJob.donor_name}</p>
                  <p className="text-xs text-clay-600 font-body">{activeJob.pickup_address}</p>
                </div>
                <div className="p-4 rounded-organic bg-parchment-100 border border-clay-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-clay-400 block font-body">
                    Destination Center
                  </span>
                  <p className="text-sm font-display font-bold text-clay-800">{activeJob.ngo_name}</p>
                  <p className="text-xs text-clay-600 font-body">{activeJob.drop_address}</p>
                </div>
              </div>

              {/* Step 1: Pickup */}
              {activeJob.status === 'ON_JOB' && (
                <div className="p-5 rounded-organic bg-apple-50/50 border border-apple-300 space-y-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-apple-600" />
                    <h3 className="font-display font-bold text-base text-apple-800">
                      Step 1: Collect Donor Pickup OTP
                    </h3>
                  </div>
                  <p className="text-xs text-clay-600 font-body">
                    Inspect the food containers, confirm the tamper seal, and ask the kitchen coordinator for their 6-digit Pickup OTP.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-clay-700 block mb-1">Donor Pickup OTP</label>
                      <input
                        type="text"
                        value={pickupOtp}
                        onChange={(e) => setPickupOtp(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="input-warm font-mono font-bold text-base"
                      />
                      <span className="text-[10px] text-clay-400 font-body">Provided by restaurant kitchen</span>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-clay-700 block mb-1">Photo Evidence</label>
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-parchment-100 border border-clay-200 rounded-organic-sm text-xs text-clay-600">
                        <Camera className="w-4 h-4 text-apple-500" />
                        <span>Package &amp; Tamper Seal Verified (GPS)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleVerifyPickup(activeJob.id)}
                    disabled={submitting}
                    className="btn-terra btn-press w-full py-3 text-sm font-bold"
                  >
                    {submitting ? 'Verifying Pickup...' : 'Confirm Pickup Handoff & Begin Transit'}
                  </button>
                </div>
              )}

              {/* Step 2: Delivery */}
              {activeJob.status === 'PICKED_UP' && (
                <div className="p-5 rounded-organic bg-apple-50/50 border border-apple-300 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-apple-600" />
                    <h3 className="font-display font-bold text-base text-apple-800">
                      Step 2: Collect NGO Receiving OTP
                    </h3>
                  </div>
                  <p className="text-xs text-clay-600 font-body">
                    Hand over the food to the receiving coordinator. Collect their Receiving OTP and verify seal intactness.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-clay-700 block mb-1">NGO Receiving OTP</label>
                      <input
                        type="text"
                        value={deliveryOtp}
                        onChange={(e) => setDeliveryOtp(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="input-warm font-mono font-bold text-base"
                      />
                      <span className="text-[10px] text-clay-400 font-body">Collect code from NGO coordinator</span>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-clay-700 block mb-1">Tamper Seal Check</label>
                      <button
                        type="button"
                        onClick={() => setSealIntact(!sealIntact)}
                        className={`w-full py-2.5 rounded-organic-sm text-xs font-bold border transition btn-press ${
                          sealIntact
                            ? 'bg-apple-50 border-apple-500 text-apple-700 shadow-sm'
                            : 'bg-brick-50 border-brick-500 text-brick-600'
                        }`}
                      >
                        {sealIntact ? '✓ Seal Fully Intact' : '⚠ Seal Tampered / Broken'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleVerifyDelivery(activeJob.id)}
                    disabled={submitting}
                    className="btn-terra btn-press w-full py-3 text-sm font-bold"
                  >
                    {submitting ? 'Verifying & Releasing...' : 'Complete Delivery & Release Settlement'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card-organic p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-apple-50 text-apple-600 flex items-center justify-center mx-auto border border-apple-200">
                <Navigation className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-clay-800">
                  You are Online &amp; Ready for Rescues
                </h3>
                <p className="text-xs text-clay-500 mt-1 max-w-md mx-auto font-body">
                  GPS location broadcasting active. When an NGO confirms a food reservation nearby, job offers appear in real-time.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('available')}
                  className="btn-terra btn-press px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Browse {availableJobs.length} Available Rescues</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 2: AVAILABLE RESCUE DELIVERIES FEED
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'available' && (
        <div className="card-organic p-6 animate-float-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-clay-200 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-apple-600 animate-pulse" />
                <h2 className="text-xl font-display font-bold text-clay-800">
                  Available Rescue Deliveries
                </h2>
              </div>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                First-accept-wins protocol. 100% declared fare payouts guaranteed upon OTP handoff.
              </p>
            </div>
            <button
              onClick={onRefresh}
              className="btn-ghost btn-press px-3.5 py-1.5 text-xs text-clay-600 self-start sm:self-auto"
            >
              Refresh Jobs
            </button>
          </div>

          {availableJobs.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-clay-200 rounded-organic mt-5">
              <Truck className="w-10 h-10 text-clay-300 mx-auto mb-2" />
              <p className="text-base font-display font-bold text-clay-700">No open rescues nearby right now</p>
              <p className="text-xs text-clay-500 mt-1 max-w-sm mx-auto font-body">
                New delivery missions are generated live as donors post surplus and NGOs reserve food.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {availableJobs.map((job, idx) => (
                <div
                  key={job.id}
                  className={`card-organic card-organic-interactive p-5 flex flex-col justify-between animate-float-in stagger-${Math.min(idx + 1, 5)}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="badge badge-basil text-[10px]">
                          {job.vehicle_class || 'Van'} Rescue
                        </span>
                        <h3 className="font-display font-extrabold text-lg text-clay-800 mt-1">
                          {job.total_quantity_kg} kg Edible Food
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-clay-400 block font-body">Guaranteed Pay</span>
                        <span className="text-xl font-display font-extrabold text-apple-600">
                          ₹{job.driver_earnings_inr || 350}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-clay-600 font-body">
                      <p className="flex items-center gap-1.5 font-medium text-clay-800">
                        <span className="w-2 h-2 rounded-full bg-apple-500" />
                        Pickup: {job.donor_name}
                      </p>
                      <p className="flex items-center gap-1.5 font-medium text-clay-800">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Drop: {job.ngo_name}
                      </p>
                      <p className="text-clay-400 pl-3.5 text-[11px]">
                        Est: {job.estimated_distance_km || 3.5} km • ~{job.estimated_duration_min || 25} mins
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-clay-100 flex items-center justify-between">
                    <span className="text-[11px] text-clay-400 font-body">Radius: {job.search_radius_km || 5.0} km</span>
                    <button
                      onClick={() => handleAcceptJob(job.id)}
                      disabled={submitting || Boolean(activeJob)}
                      className="btn-terra btn-press px-5 py-2.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span>I'll Deliver This</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 3: MY EARNINGS & PAYOUT LEDGER
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'earnings' && (
        <div className="card-organic p-6 sm:p-8 animate-float-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-clay-200 gap-3">
            <div>
              <span className="badge badge-saffron text-xs">Direct Logistics Settlement</span>
              <h2 className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                My Earnings &amp; Payout Ledger
              </h2>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                100% declared delivery fare paid directly to your registered bank / UPI account. Zero commission deducted.
              </p>
            </div>
            <button
              onClick={() => setStatusMsg('Payout of ₹14,200 requested to UPI (ramesh@okhdfcbank). Settles in 5 mins.')}
              className="btn-terra btn-press px-4 py-2 text-xs flex items-center gap-1.5 self-start sm:self-auto font-bold"
            >
              <CreditCard className="w-4 h-4" />
              <span>Instant Bank Transfer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-organic bg-apple-50/50 border border-apple-300">
              <span className="text-xs text-apple-800 block font-body">Available for Payout</span>
              <span className="text-2xl font-display font-black text-apple-700 mt-1 block">₹14,200</span>
              <span className="text-[11px] text-apple-600 mt-0.5 block font-body">Ready for immediate UPI withdrawal</span>
            </div>

            <div className="p-5 rounded-organic bg-parchment-100 border border-clay-200">
              <span className="text-xs text-clay-500 block font-body">Rescues Completed</span>
              <span className="text-2xl font-display font-black text-clay-800 mt-1 block">28 Trips</span>
              <span className="text-[11px] text-clay-400 mt-0.5 block font-body">740 kg food rescued with zero spillage</span>
            </div>

            <div className="p-5 rounded-organic bg-parchment-100 border border-clay-200">
              <span className="text-xs text-clay-500 block font-body">Average Trip Fare</span>
              <span className="text-2xl font-display font-black text-clay-800 mt-1 block">₹507</span>
              <span className="text-[11px] text-clay-400 mt-0.5 block font-body">Transparent declared distance + weight formula</span>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            <h3 className="text-base font-display font-bold text-clay-800">Recent Completed Rescues</h3>
            <div className="divide-y divide-clay-100 border border-clay-200 rounded-organic overflow-hidden">
              {[
                { id: 'JOB-9821', title: 'Taj Grand Kitchens → Dharavi Welfare', weight: '25 kg', date: 'Today, 14:30', pay: '₹480' },
                { id: 'JOB-9743', title: 'Trident Nariman Point → Mahim Shelter', weight: '40 kg', date: 'Yesterday, 19:15', pay: '₹620' },
                { id: 'JOB-9610', title: 'ITC Grand Central → Dadar Community Hub', weight: '30 kg', date: '23 Sep, 13:45', pay: '₹510' },
              ].map((trip) => (
                <div key={trip.id} className="p-4 bg-white flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-clay-700">#{trip.id}</span>
                      <span className="badge badge-basil text-[9px]">Settled</span>
                    </div>
                    <p className="text-sm font-bold text-clay-800 mt-0.5">{trip.title}</p>
                    <p className="text-xs text-clay-500 font-body">{trip.weight} • {trip.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-display text-apple-600 block">{trip.pay}</span>
                    <span className="text-[10px] text-clay-400 font-body">Direct Payout</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE 4: DRIVER LICENSE & VEHICLE PROFILE
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="card-organic p-6 sm:p-8 animate-float-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-clay-200 gap-3">
            <div>
              <span className="badge badge-basil text-xs">Driver Compliance</span>
              <h2 className="text-2xl font-display font-extrabold text-clay-800 mt-1">
                Driver License &amp; Vehicle Verification
              </h2>
              <p className="text-xs text-clay-500 mt-0.5 font-body">
                Official documents verified for commercial delivery eligibility and food cargo handling.
              </p>
            </div>
            <button
              onClick={() => setShowVerifModal(true)}
              className="btn-terra btn-press px-4 py-2 text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <FileCheck className="w-4 h-4" />
              <span>Update Credentials</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'VALID_DRIVING_LICENSE',
                title: 'Commercial Driving License',
                hint: 'Parivahan Sarathi Transport DL',
                status: 'VERIFIED',
                number: activeVerif.document_type === 'VALID_DRIVING_LICENSE' ? activeVerif.document_number : 'MH0120150048291',
                authority: 'Ministry of Road Transport & Highways (MoRTH)',
              },
              {
                id: 'GOVT_PHOTO_ID',
                title: 'Government Photo ID',
                hint: 'Aadhaar / Voter ID',
                status: activeVerif.document_type === 'GOVT_PHOTO_ID' ? 'VERIFIED' : 'AVAILABLE',
                number: activeVerif.document_type === 'GOVT_PHOTO_ID' ? activeVerif.document_number : 'XXXX-XXXX-8921',
                authority: 'UIDAI / Election Commission',
              },
              {
                id: 'POLICE_VERIFICATION_REPORT',
                title: 'Police Verification Report',
                hint: 'Annual Background Check Certificate',
                status: activeVerif.document_type === 'POLICE_VERIFICATION_REPORT' ? 'VERIFIED' : 'AVAILABLE',
                number: activeVerif.document_type === 'POLICE_VERIFICATION_REPORT' ? activeVerif.document_number : 'PV/MUM/2023/44810',
                authority: 'Mumbai Police Special Branch',
              },
              {
                id: 'AGGREGATOR_COMPANY_BADGE',
                title: 'Fleet Aggregator Badge',
                hint: 'Commercial Fleet Identifier',
                status: activeVerif.document_type === 'AGGREGATOR_COMPANY_BADGE' ? 'VERIFIED' : 'AVAILABLE',
                number: activeVerif.document_type === 'AGGREGATOR_COMPANY_BADGE' ? activeVerif.document_number : 'FLT-MH-9942',
                authority: 'AnnaSetu Logistics Cooperative',
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
                      <span>Commercial Fleet Verified</span>
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
                        setStatusMsg(`Active driver document set to: ${doc.title}`);
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

      {/* Driver Verification Modal */}
      <VerificationModal
        isOpen={showVerifModal}
        onClose={() => setShowVerifModal(false)}
        role="DRIVER"
        entityName="Ramesh Kumar"
        currentDocType={activeVerif.document_type}
        currentDocNumber={activeVerif.document_number}
        onVerifiedSuccess={(data) => {
          setActiveVerif({
            document_type: data.document_type,
            document_title: data.document_title,
            document_number: data.document_number,
            badge_text: data.badge_text,
          });
          setStatusMsg(`Verification updated: ${data.document_title} (${data.document_number})`);
        }}
      />
    </div>
  );
}
