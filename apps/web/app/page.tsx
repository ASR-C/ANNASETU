'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DonorView from '../components/DonorView';
import NgoView from '../components/NgoView';
import DriverView from '../components/DriverView';
import CopilotDrawer from '../components/CopilotDrawer';
import CertificateModal from '../components/CertificateModal';
import AuthPreface, { AuthorityRole } from '../components/AuthPreface';
import { api } from '../lib/api';
import { liveSync } from '../lib/sync';
import { Sparkles } from 'lucide-react';

export default function HomePage() {
  const [activeRole, setActiveRole] = useState<'DONOR' | 'NGO' | 'DRIVER' | 'PREFACE'>('PREFACE');
  const [activeEntityName, setActiveEntityName] = useState<string>('Taj Grand Kitchens & Banquets');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [activeCert, setActiveCert] = useState<any>(null);

  // Real-Time Notification Toast State
  const [liveToast, setLiveToast] = useState<{
    id: number;
    title: string;
    message: string;
    badge: string;
    type: 'donation' | 'job' | 'info';
  } | null>(null);

  // Live Telemetry & Data States
  const [platformStats, setPlatformStats] = useState<any>({
    active_rescues: 3,
    active_drivers: 4,
    total_food_rescued_kg: 1240,
    total_meals_served: 2480,
  });

  const [donations, setDonations] = useState<any[]>([]);
  const [needs, setNeeds] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [deliveryJobs, setDeliveryJobs] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>({ balance_inr: 15000, reserved_inr: 0, available_inr: 15000 });
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage or URL query param (?role=donor | ?role=ngo | ?role=driver)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role')?.toUpperCase();
      if (urlRole && ['DONOR', 'NGO', 'DRIVER'].includes(urlRole)) {
        setActiveRole(urlRole as any);
        if (urlRole === 'DONOR') setActiveEntityName('Taj Grand Kitchens & Banquets');
        else if (urlRole === 'NGO') setActiveEntityName('Mumbai Roti & Annadaan Foundation');
        else if (urlRole === 'DRIVER') setActiveEntityName('Ramesh Kumar (Van MH 01 CR 4821)');
        return;
      }

      const savedRole = localStorage.getItem('annasetu_active_role') as any;
      const savedEntity = localStorage.getItem('annasetu_active_entity');
      if (savedRole && ['DONOR', 'NGO', 'DRIVER'].includes(savedRole)) {
        setActiveRole(savedRole);
        if (savedEntity) setActiveEntityName(savedEntity);
      }
    }
  }, []);

  const loadData = async () => {
    try {
      const [
        statsData,
        donationsData,
        needsData,
        proposalsData,
        jobsData,
        walletData,
      ] = await Promise.allSettled([
        api.getAdminStats(),
        api.getDonations(),
        api.getNeeds(),
        api.getProposals(),
        api.getDeliveryJobs(),
        api.getWallet('ngo-org-001'),
      ]);

      if (statsData.status === 'fulfilled') setPlatformStats(statsData.value);
      if (donationsData.status === 'fulfilled') setDonations(donationsData.value);
      if (needsData.status === 'fulfilled') setNeeds(needsData.value);
      if (proposalsData.status === 'fulfilled') setProposals(proposalsData.value);
      if (jobsData.status === 'fulfilled') setDeliveryJobs(jobsData.value);
      if (walletData.status === 'fulfilled') setWallet(walletData.value);
    } catch (e) {
      console.error('Data load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Fast 2.5s interval polling
    const interval = setInterval(loadData, 2500);

    // Instant zero-latency cross-tab event subscription
    const unsubscribe = liveSync.subscribe((msg) => {
      loadData();

      if (msg.type === 'DONATION_POSTED' && msg.payload) {
        setLiveToast({
          id: Date.now(),
          title: 'Surplus Batch Live & Synchronized!',
          message: `${msg.payload.title || 'Surplus Food'} (${msg.payload.quantity_kg || 25} kg) from ${msg.payload.donor_name || 'Restaurant'} is now live across Receiver & Driver feeds.`,
          badge: 'Live Auto-Sync',
          type: 'donation',
        });
      } else if (msg.type === 'JOB_ACCEPTED' && msg.payload) {
        setLiveToast({
          id: Date.now(),
          title: 'Delivery Partner Assigned!',
          message: `Delivery partner accepted the rescue mission. Handoff in progress.`,
          badge: 'Driver Dispatch',
          type: 'job',
        });
      } else if (msg.type === 'JOB_RESERVED' || msg.type === 'QUOTA_CLAIMED') {
        setLiveToast({
          id: Date.now(),
          title: 'Surplus Batch Claimed by NGO!',
          message: `Community meal target updated and transport mission scheduled.`,
          badge: 'NGO Allocation',
          type: 'info',
        });
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Auto-dismiss live toast after 6 seconds
  useEffect(() => {
    if (liveToast) {
      const timer = setTimeout(() => setLiveToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [liveToast]);

  const handleLogin = (role: AuthorityRole, entityName: string) => {
    setActiveRole(role);
    setActiveEntityName(entityName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('annasetu_active_role', role);
      localStorage.setItem('annasetu_active_entity', entityName);
      const url = new URL(window.location.href);
      url.searchParams.set('role', role.toLowerCase());
      window.history.pushState({}, '', url.toString());
    }
    setLiveToast({
      id: Date.now(),
      title: `${role === 'DONOR' ? 'Restaurant Donor' : role === 'NGO' ? 'NGO Beneficiary' : 'Delivery Partner'} Portal Active`,
      message: `Successfully logged in as ${entityName}. Multi-page dashboard loaded.`,
      badge: 'Authenticated',
      type: 'info',
    });
  };

  const handleSwitchRole = (newRole: AuthorityRole) => {
    handleLogin(
      newRole,
      newRole === 'DONOR'
        ? 'Taj Grand Kitchens & Banquets'
        : newRole === 'NGO'
        ? 'Mumbai Roti & Annadaan Foundation'
        : 'Ramesh Kumar (Van MH 01 CR 4821)'
    );
  };

  const handleSignOut = () => {
    setActiveRole('PREFACE');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('annasetu_active_role');
      localStorage.removeItem('annasetu_active_entity');
      localStorage.removeItem('annasetu_token');
      localStorage.removeItem('annasetu_active_user');
      const url = new URL(window.location.href);
      url.searchParams.delete('role');
      window.history.pushState({}, '', url.toString());
    }
    setLiveToast({
      id: Date.now(),
      title: 'Signed Out',
      message: 'Returned to single login page. Select an account to enter any portal.',
      badge: 'Session Ended',
      type: 'info',
    });
  };

  const handleOpenCertificate = async (jobId: string) => {
    try {
      const cert = await api.getCertificate(jobId);
      setActiveCert(cert);
    } catch (e) {
      setActiveCert({
        certificate_title: 'ANNASETU Verified Impact Reporting & Sustainability Documentation',
        certificate_number: `AS-CERT-${jobId.slice(0, 8).toUpperCase()}`,
        donor_name: activeEntityName || 'Taj Grand Kitchens & Banquets',
        recipient_ngo: 'Mumbai Roti & Annadaan Foundation',
        food_rescued_kg: 25.0,
        meals_supported: 50,
        co2e_avoided_kg: 62.5,
        water_conserved_liters: 3850,
        wording_disclaimer:
          'ANNASETU Verified Impact Reporting & Sustainability Documentation. Issued as documentation to support applicable CSR, tax, and ESG sustainability reporting.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Universal Navigation Header with Role Isolation & Fast Multi-Window Switcher */}
      <Navbar
        activeRole={activeRole}
        onSignOut={handleSignOut}
        onOpenCopilot={() => setCopilotOpen(true)}
        stats={platformStats}
        onRefresh={loadData}
        activeEntityName={activeEntityName}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. Logged Out / Login Screen: Shows Authority Portals */}
        {activeRole === 'PREFACE' && (
          <AuthPreface
            onLogin={handleLogin}
            stats={platformStats}
          />
        )}

        {/* 2. Restaurant Portal ONLY (When logged in as Restaurant) */}
        {activeRole === 'DONOR' && (
          <DonorView
            donations={donations}
            deliveryJobs={deliveryJobs}
            impactStats={platformStats}
            onRefresh={loadData}
            onOpenCertificate={handleOpenCertificate}
            activeEntityName={activeEntityName}
          />
        )}

        {/* 3. NGO Beneficiary Portal ONLY (When logged in as NGO) */}
        {activeRole === 'NGO' && (
          <NgoView
            needs={needs}
            donations={donations}
            proposals={proposals}
            wallet={wallet}
            deliveryJobs={deliveryJobs}
            onRefresh={loadData}
            activeEntityName={activeEntityName}
          />
        )}

        {/* 4. Delivery Partner Portal ONLY (When logged in as Delivery Partner) */}
        {activeRole === 'DRIVER' && (
          <DriverView
            jobs={deliveryJobs}
            onRefresh={loadData}
            activeEntityName={activeEntityName}
          />
        )}
      </main>

      {/* Read-Only AI Copilot Drawer */}
      <CopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        activeRole={activeRole === 'PREFACE' ? 'DONOR' : activeRole}
      />


      {/* Verified Impact Certificate Modal */}
      {activeCert && (
        <CertificateModal
          certData={activeCert}
          onClose={() => setActiveCert(null)}
        />
      )}
        {/* Floating Real-Time Synchronization Notification Toast */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-[999999] max-w-md w-full animate-float-in">
          <div className="card-organic p-4 bg-gray-900 text-white border-2 border-apple-500/70 shadow-warm-lg flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-apple-500/20 text-apple-300 flex items-center justify-center shrink-0 border border-apple-400/30">
              <Sparkles className="w-5 h-5 text-apple-400 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1 pr-2">
              <div className="flex items-center gap-2">
                <span className="badge badge-blue text-[9px] py-0 px-2 font-bold uppercase tracking-wider">
                  {liveToast.badge}
                </span>
                <span className="text-[10px] text-apple-300 font-mono">0ms cross-window sync</span>
              </div>
              <h4 className="text-sm font-black font-display text-white">{liveToast.title}</h4>
              <p className="text-xs text-gray-300 leading-relaxed font-body">{liveToast.message}</p>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition btn-press"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#080C10] text-gray-300 py-10 border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <p className="font-display font-bold text-lg text-white tracking-tight">
                ANNA<span className="text-apple-400">SETU</span>
              </p>
              <p className="text-sm text-gray-400 max-w-md">
                Bridging surplus food to hungry communities — one warm meal at a time.
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-gray-400">
                Anna (Food) + Setu (Bridge) • Zero-tolerance food waste
              </p>
              <p className="text-xs text-gray-500">
                Transparent logistics • Deterministic matching • Non-profit platform
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
