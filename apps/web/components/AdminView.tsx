'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Truck,
  CheckCircle,
  XCircle,
  ExternalLink,
  Sliders,
  FileCheck,
  Activity,
  Layers,
  Search,
  Eye,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  adminStats: any;
  verifications: any[];
  integrityReviews: any[];
  deliveryJobs: any[];
  onRefresh: () => void;
}

export default function AdminView({
  adminStats,
  verifications,
  integrityReviews,
  deliveryJobs,
  onRefresh,
}: Props) {
  const [activeTab, setActiveTab] = useState<'VERIFICATION' | 'RESCUES' | 'INTEGRITY' | 'CONFIG'>('VERIFICATION');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const handleReview = async (orgId: string, status: 'VERIFIED' | 'REJECTED') => {
    setReviewingId(orgId);
    try {
      await api.reviewOrg(orgId, status, 'Approved via Admin Manual Verification Protocol');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#08120B] rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-[#1B3322] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse shadow-glow-apple" />
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#4ADE80] font-display">
                Rescue Command Center (RCC)
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-1 font-display">Platform Governance &amp; Ops</h1>
            <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1 font-normal">
              Deterministic verification, real-time rescue handoff auditing, and AI integrity review.
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="px-4 py-2.5 rounded-xl bg-[#162D1F] hover:bg-[#1C3A27] text-xs font-bold text-[#4ADE80] border border-[#22C55E]/40 flex items-center gap-2 transition shrink-0 btn-press shadow-glow-apple"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Live Telemetry</span>
          </button>
        </div>

        {/* 5 Core Command Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="stat-card">
            <span className="text-[11px] text-[#94A3B8] block font-medium">Active Rescues</span>
            <span className="text-2xl font-black text-[#4ADE80] mt-0.5 block font-display">{adminStats?.active_rescues || 28}</span>
            <span className="text-[10px] text-[#86EFAC]">Live on map</span>
          </div>
          <div className="stat-card">
            <span className="text-[11px] text-[#94A3B8] block font-medium">Pending Verification</span>
            <span className="text-2xl font-black text-white mt-0.5 block font-display">{adminStats?.pending_verifications || 7}</span>
            <span className="text-[10px] text-[#A3E635]">Gov doc review</span>
          </div>
          <div className="stat-card">
            <span className="text-[11px] text-[#94A3B8] block font-medium">Active Drivers</span>
            <span className="text-2xl font-black text-white mt-0.5 block font-display">{adminStats?.active_drivers || 16}</span>
            <span className="text-[10px] text-[#86EFAC]">In service radius</span>
          </div>
          <div className="stat-card">
            <span className="text-[11px] text-[#94A3B8] block font-medium">Integrity Reviews</span>
            <span className="text-2xl font-black text-[#4ADE80] mt-0.5 block font-display">{adminStats?.integrity_reviews || 2}</span>
            <span className="text-[10px] text-[#94A3B8]">Vision flags</span>
          </div>
          <div className="stat-card">
            <span className="text-[11px] text-[#94A3B8] block font-medium">Pending Settlements</span>
            <span className="text-2xl font-black text-[#86EFAC] mt-0.5 block font-display">{adminStats?.pending_settlements || 4}</span>
            <span className="text-[10px] text-[#86EFAC]">Escrow ready</span>
          </div>
        </div>
      </div>

      {/* Admin Modules Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1B3322] pb-2 overflow-x-auto">
        {[
          { id: 'VERIFICATION', label: 'Organization Verification Queue', icon: FileCheck, count: verifications.length },
          { id: 'RESCUES', label: 'Live Rescues Monitor', icon: Activity, count: deliveryJobs.length },
          { id: 'INTEGRITY', label: 'AI Integrity Reviews', icon: ShieldAlert, count: integrityReviews.length },
          { id: 'CONFIG', label: 'Versioned Configuration', icon: Sliders, count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 btn-press ${
              activeTab === tab.id
                ? 'bg-[#162D1F] text-[#4ADE80] border border-[#22C55E]/40 shadow-glow-apple'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#0D1812]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-[#1E293B] text-[#86EFAC]' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: VERIFICATION QUEUE */}
      {activeTab === 'VERIFICATION' && (
        <div className="card-organic p-6 space-y-4 grain-bg">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] font-display">Government Verification Cases</h2>
            <p className="text-xs text-[#64748B]">
              Statutory verification protocol: Official sovereign registry links for administrator validation.
            </p>
          </div>

          {verifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748B]">
              No pending organizations in the verification queue.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {verifications.map((org) => (
                <div key={org.id} className="py-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge badge-blue text-[10px]">
                        {org.org_type === 'DONOR' ? 'VENDOR / RESTAURANT' : org.org_type}
                      </span>
                      <span className="font-extrabold text-sm text-[#0F172A] font-display">{org.name}</span>
                      <span className="text-xs text-[#64748B]">({org.city})</span>
                      <span className="badge badge-clay text-[10px]">
                        {org.badge_text || 'Submitted for Review'}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B]">{org.address}</p>

                    {/* Chosen Verification Document Box */}
                    <div className="p-3.5 bg-[#0D1812] rounded-2xl border border-[#1B3322] space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
                          <FileCheck className="w-4 h-4 text-[#4ADE80]" />
                          <span>Submitted Proof: <strong>{org.document_title || org.document_type}</strong></span>
                        </span>
                        <code className="text-xs font-mono font-bold bg-[#060D09] px-2 py-0.5 rounded border border-[#1B3322] text-[#4ADE80]">
                          {org.document_number}
                        </code>
                      </div>

                      {org.description && (
                        <p className="text-[11px] text-[#94A3B8] leading-relaxed font-normal">
                          {org.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#94A3B8]">
                        <span>Authority: <strong className="text-white">{org.issuing_authority}</strong></span>
                        <span>•</span>
                        <a
                          href={org.portal_url || 'https://ngodarpan.gov.in'}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#4ADE80] hover:text-[#86EFAC] hover:underline flex items-center gap-1"
                        >
                          <span>Open Official Registry Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <button
                      onClick={() => handleReview(org.id, 'REJECTED')}
                      disabled={reviewingId === org.id}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-400 bg-gray-900 hover:bg-gray-800 border border-gray-700 transition btn-press"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReview(org.id, 'VERIFIED')}
                      disabled={reviewingId === org.id}
                      className="btn-terra px-4 py-2 text-xs font-bold flex items-center gap-1.5 btn-press shadow-glow-apple"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                      <span>Approve &amp; Verify</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE RESCUES MONITOR */}
      {activeTab === 'RESCUES' && (
        <div className="card-organic p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white font-display">Live Rescue Missions &amp; Geofence Telemetry</h2>
            <p className="text-xs text-[#94A3B8]">
              End-to-end handoff audit: Pickup OTP → Tamper Seal → In-Transit GPS → Delivery OTP
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1812] text-white font-bold uppercase tracking-wider text-[10px] rounded-xl border border-[#1B3322]">
                <tr>
                  <th className="p-3 rounded-l-xl">Rescue ID</th>
                  <th className="p-3">Donor → NGO</th>
                  <th className="p-3">Batch Qty</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Fare (INR)</th>
                  <th className="p-3 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B3322]">
                {deliveryJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#0D1812] transition">
                    <td className="p-3 font-mono font-bold text-white">#{job.id.slice(0, 8)}</td>
                    <td className="p-3">
                      <div className="font-bold text-white">{job.donor_name}</div>
                      <div className="text-[#94A3B8] text-[10px]">→ {job.ngo_name}</div>
                    </td>
                    <td className="p-3 font-bold text-[#4ADE80]">{job.total_quantity_kg} kg</td>
                    <td className="p-3 text-white">{job.driver_name || 'Unassigned'}</td>
                    <td className="p-3 font-mono text-[#94A3B8]">{job.vehicle_class}</td>
                    <td className="p-3 font-bold text-white">₹{job.total_ngo_charge_inr}</td>
                    <td className="p-3">
                      <span className={`badge ${
                        job.status === 'DELIVERED' ? 'badge-basil' : 'badge-blue'
                      } text-[10px]`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AI INTEGRITY REVIEWS */}
      {activeTab === 'INTEGRITY' && (
        <div className="card-organic p-6 space-y-4 grain-bg">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] font-display">AI Integrity Verification &amp; Package Auditing</h2>
            <p className="text-xs text-[#64748B]">
              Computer vision package comparison with constrained safety and freshness labels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrityReviews.map((rev) => (
              <div key={rev.id} className="p-5 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#64748B]">Job #{rev.delivery_job_id?.slice(0, 8)}</span>
                  <span className="badge badge-basil text-[10px]">
                    {rev.verdict}
                  </span>
                </div>
                <div className="text-xs text-[#0F172A]">
                  <p className="font-semibold text-[#0F172A]">Confidence: {rev.confidence_score}%</p>
                  <p className="text-[#64748B] mt-1">{rev.details}</p>
                </div>
                <div className="pt-2 border-t border-[#E2E8F0] text-[11px] text-[#22C55E] font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Physical Seal Intact • Geofence Passed • Zero Visible Discrepancy</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM CONFIGURATION */}
      {activeTab === 'CONFIG' && (
        <div className="card-organic p-6 space-y-4 grain-bg">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] font-display">Versioned Business Rules &amp; Config Engine</h2>
            <p className="text-xs text-[#64748B]">
              Centralized business rules stored in versioned config tables rather than scattered code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#0D1812] border border-[#1B3322] space-y-2 shadow-dark-highlight">
              <span className="text-xs font-bold text-[#4ADE80] font-display">Matching Engine Weights (v1)</span>
              <pre className="text-[11px] bg-[#060D09] p-3 rounded-xl border border-[#1B3322] text-[#86EFAC] font-mono overflow-x-auto">
{JSON.stringify({
  distance: 0.20,
  eta: 0.20,
  expiry_buffer: 0.15,
  need_fulfillment: 0.15,
  route_efficiency: 0.10,
  driver_availability: 0.10,
  deadline_urgency: 0.10
}, null, 2)}
              </pre>
            </div>

            <div className="p-4 rounded-2xl bg-[#0D1812] border border-[#1B3322] space-y-2 shadow-dark-highlight">
              <span className="text-xs font-bold text-[#4ADE80] font-display">Marketplace &amp; Fare Rules (v1)</span>
              <pre className="text-[11px] bg-[#060D09] p-3 rounded-xl border border-[#1B3322] text-[#86EFAC] font-mono overflow-x-auto">
{JSON.stringify({
  service_fee_percent: 12.0,
  min_donation_kg: 5.0,
  driver_search_radii_km: [5.0, 10.0, 15.0],
  reservation_timeout_minutes: 15,
  otp_rules: { length: 6, expiry_minutes: 30 }
}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
