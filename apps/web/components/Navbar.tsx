'use client';

import React, { useState, useEffect } from 'react';
import {
  Utensils,
  HeartHandshake,
  Truck,
  Sparkles,
  RefreshCw,
  ArrowRightLeft,
  Database,
  LogOut,
  PlusCircle,
  FileCheck,
  Wallet,
  ShieldCheck,
  Award
} from 'lucide-react';
import { getSupabaseConfig } from '../lib/supabase';

interface Props {
  activeRole: 'DONOR' | 'NGO' | 'DRIVER' | 'PREFACE';
  onSignOut: () => void;
  onOpenCopilot: () => void;
  stats: any;
  onRefresh: () => void;
  activeEntityName?: string;
  onSwitchRole?: (role: 'DONOR' | 'NGO' | 'DRIVER') => void;
}

export default function Navbar({
  activeRole,
  onSignOut,
  onOpenCopilot,
  stats,
  onRefresh,
  activeEntityName,
  onSwitchRole,
}: Props) {
  const [isCloud, setIsCloud] = useState(false);

  useEffect(() => {
    setIsCloud(getSupabaseConfig().isConnected);
  }, []);

  const roleConfig = {
    DONOR: {
      icon: Utensils,
      label: 'Restaurant Portal',
      sublabel: 'Verified Vendor',
      accentBorder: 'border-apple-500/40',
      accentBg: 'bg-apple-500/20',
      accentText: 'text-apple-400',
      dotColor: 'bg-apple-400',
    },
    NGO: {
      icon: HeartHandshake,
      label: 'NGO Beneficiary Portal',
      sublabel: 'Tax Exempt 12A/80G',
      accentBorder: 'border-blue-500/40',
      accentBg: 'bg-blue-500/20',
      accentText: 'text-blue-400',
      dotColor: 'bg-blue-400',
    },
    DRIVER: {
      icon: Truck,
      label: 'Delivery Partner Portal',
      sublabel: 'Commercial DL Verified',
      accentBorder: 'border-gray-500/40',
      accentBg: 'bg-gray-800',
      accentText: 'text-gray-300',
      dotColor: 'bg-apple-400',
    },
  };

  const currentRole = activeRole !== 'PREFACE' ? roleConfig[activeRole] : null;

  return (
    <header className="sticky top-0 z-40 bg-dark-900 border-b border-gray-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={activeRole === 'PREFACE' ? undefined : onSignOut}
            className={`flex items-center gap-3 ${activeRole !== 'PREFACE' ? 'cursor-pointer group' : ''}`}
            title={activeRole !== 'PREFACE' ? 'Click to sign out / return to login' : undefined}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-apple-500 to-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl tracking-tight text-white">
                  ANNA<span className="text-apple-400">SETU</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-dark-800 text-blue-400 rounded-full border border-gray-700">
                  Rescue Bridge
                </span>
              </div>
              <p className="text-[11px] text-gray-400 -mt-0.5 font-body">Surplus to need, one meal at a time</p>
            </div>
          </div>

          {/* ROLE-ISOLATED CENTER SECTION & MULTI-PORTAL SWITCHER */}
          {currentRole && (
            <div className="hidden md:flex items-center gap-3">
              <div className={`flex items-center gap-2.5 px-3.5 py-1.5 bg-dark-850 rounded-lg border ${currentRole.accentBorder}`}>
                <div className={`w-7 h-7 rounded-md ${currentRole.accentBg} ${currentRole.accentText} flex items-center justify-center`}>
                  {React.createElement(currentRole.icon, { className: 'w-4 h-4' })}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${currentRole.accentText}`}>
                      {currentRole.label}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentRole.dotColor}`}></span>
                    <span className="text-[10px] text-gray-400">{currentRole.sublabel}</span>
                  </div>
                  <p className="text-xs font-bold text-white truncate max-w-[200px]">
                    {activeEntityName || 'Organization Name'}
                  </p>
                </div>
              </div>

              {/* Fast Portal Switcher */}
              {onSwitchRole && (
                <div className="flex items-center gap-1 bg-dark-850 p-1 rounded-lg border border-gray-700">
                  <button
                    onClick={() => onSwitchRole('DONOR')}
                    className={`px-3 py-1 rounded text-[11px] font-extrabold transition flex items-center gap-1.5 btn-press ${
                      activeRole === 'DONOR'
                        ? 'bg-apple-600 text-white shadow-xs'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                    title="Switch to Restaurant Donor Portal"
                  >
                    <Utensils className="w-3 h-3 text-apple-300" />
                    <span>Donor</span>
                  </button>
                  <button
                    onClick={() => onSwitchRole('NGO')}
                    className={`px-3 py-1 rounded text-[11px] font-extrabold transition flex items-center gap-1.5 btn-press ${
                      activeRole === 'NGO'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                    title="Switch to NGO Receiver Portal"
                  >
                    <HeartHandshake className="w-3 h-3 text-blue-300" />
                    <span>Receiver</span>
                  </button>
                  <button
                    onClick={() => onSwitchRole('DRIVER')}
                    className={`px-3 py-1 rounded text-[11px] font-extrabold transition flex items-center gap-1.5 btn-press ${
                      activeRole === 'DRIVER'
                        ? 'bg-gray-700 text-white shadow-xs'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                    title="Switch to Delivery Partner Portal"
                  >
                    <Truck className="w-3 h-3 text-apple-400" />
                    <span>Driver</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Database Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-default select-none ${
                isCloud
                  ? 'bg-dark-850 text-apple-300 border-apple-500/30'
                  : 'bg-dark-850 text-gray-300 border-gray-700'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-apple-400" />
              <span className="hidden sm:inline">
                {isCloud ? 'Cloud Sync' : 'Local Storage'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isCloud ? 'bg-apple-400 animate-pulse' : 'bg-blue-400'
                }`}
              />
            </div>

            {/* Quick Refresh */}
            <button
              onClick={onRefresh}
              title="Refresh data"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition border border-gray-700 btn-press"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* AI Copilot Button */}
            <button
              onClick={onOpenCopilot}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-apple-500 to-blue-600 hover:from-apple-400 hover:to-blue-500 text-white text-xs font-bold shadow-xs transition btn-press"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>

            {/* Sign Out Button */}
            {activeRole !== 'PREFACE' && (
              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-dark-850 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold transition border border-gray-700 btn-press"
                title="Log out and return to single login page"
              >
                <LogOut className="w-3.5 h-3.5 text-gray-400" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* ROLE-TAILORED TELEMETRY SUB-BAR - Only visible inside active portal interfaces */}
        {activeRole !== 'PREFACE' && (
          <div className="py-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400 overflow-x-auto font-body">
            {activeRole === 'DONOR' ? (
              <>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="flex items-center gap-1 font-semibold text-apple-400">
                    <Utensils className="w-3 h-3 text-apple-400" />
                    Restaurant Dashboard:
                  </span>
                  <span>Active Batches: <strong className="text-white">{stats?.total_donations || 2}</strong></span>
                  <span className="text-gray-700">•</span>
                  <span>Food Rescued: <strong className="text-apple-300">{stats?.total_food_rescued_kg || 1240} kg</strong></span>
                  <span className="text-gray-700">•</span>
                  <span>Meals Served: <strong className="text-blue-400">{stats?.total_meals_served || 2480}</strong></span>
                </div>
                <div className="hidden lg:flex items-center gap-2 text-gray-400">
                  <span className="flex items-center gap-1 text-apple-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Good Samaritan Act: Active</span>
                  </span>
                  <span>•</span>
                  <span>ESG Certified: <strong className="text-white">Yes</strong></span>
                </div>
              </>
            ) : activeRole === 'NGO' ? (
              <>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="flex items-center gap-1 font-semibold text-blue-400">
                    <HeartHandshake className="w-3 h-3 text-blue-400" />
                    NGO Relief Center:
                  </span>
                  <span>Active Requests: <strong className="text-white">{stats?.total_needs || 1}</strong></span>
                  <span className="text-gray-700">•</span>
                  <span>Ongoing Dispatches: <strong className="text-apple-400">{stats?.active_rescues || 2}</strong></span>
                  <span className="text-gray-700">•</span>
                  <span>Escrow Covered: <strong className="text-blue-300">100%</strong></span>
                </div>
                <div className="hidden lg:flex items-center gap-2 text-gray-400">
                  <span>Beneficiary Radius: <strong className="text-white">10 km</strong></span>
                  <span>•</span>
                  <span>Tax Exemption: <strong className="text-apple-400">80G / 12A Verified</strong></span>
                </div>
              </>
            ) : activeRole === 'DRIVER' ? (
              <>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="flex items-center gap-1 font-semibold text-gray-300">
                    <Truck className="w-3 h-3 text-apple-400" />
                    Driver Dispatch:
                  </span>
                  <span>Available Missions: <strong className="text-white">{stats?.active_rescues || 1}</strong></span>
                  <span className="text-gray-700">•</span>
                  <span>Completed: <strong className="text-apple-400">{stats?.completed_rescues || 28}</strong></span>
                  <span className="text-gray-700">•</span>
                  <span>Rating: <strong className="text-blue-400">4.95 ⭐</strong></span>
                </div>
                <div className="hidden lg:flex items-center gap-2 text-gray-400">
                  <span>Broadcast: <strong className="text-white">5 → 10 km</strong></span>
                  <span>•</span>
                  <span>Instant Settlement: <strong className="text-apple-400">Active</strong></span>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}
