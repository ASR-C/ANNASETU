'use client';

import React, { useState } from 'react';
import {
  Utensils,
  HeartHandshake,
  Truck,
  ShieldCheck,
  ArrowRight,
  Lock,
  Building2,
  Sparkles,
  CheckCircle2,
  KeyRound,
  FileCheck,
  Info,
  ChevronRight,
  ExternalLink,
  Award,
  FileText,
  BadgeCheck,
  AlertTriangle,
  UserPlus,
  LogIn,
  Database,
  Mail,
  User,
  Phone,
  MapPin,
  Check
} from 'lucide-react';
import { VERIFICATION_OPTIONS, VerificationOption } from '../lib/verificationOptions';
import { realDb } from '../lib/db';

export type AuthorityRole = 'DONOR' | 'NGO' | 'DRIVER';

interface Props {
  onLogin: (role: AuthorityRole, entityName: string) => void;
  stats?: any;
}

export default function AuthPreface({ onLogin, stats }: Props) {
  const [authTab, setAuthTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'AUTO' | AuthorityRole>('AUTO');

  // Sign Up State
  const [signupRole, setSignupRole] = useState<AuthorityRole>('DONOR');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOrgName, setRegOrgName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('Mumbai');
  const [selectedDocId, setSelectedDocId] = useState<string>('FSSAI_LICENSE');
  const [documentNumber, setDocumentNumber] = useState<string>('11521018000456');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'DONOR' as AuthorityRole,
      title: 'Restaurant Donor Portal',
      entityName: 'Taj Grand Kitchens & Banquets',
      email: 'taj@annasetu.org',
      icon: Utensils,
      color: 'apple',
      description: 'Publish kitchen surplus batches, track CO₂ avoidance & download 80G CSR tax certificates.',
    },
    {
      role: 'NGO' as AuthorityRole,
      title: 'NGO Beneficiary Portal',
      entityName: 'Mumbai Roti & Annadaan Foundation',
      email: 'ngo@annasetu.org',
      icon: HeartHandshake,
      color: 'amber',
      description: 'Manage 3-meal feeding quotas, claim live donor batches & receive GPS delivery with Receiving OTP.',
    },
    {
      role: 'DRIVER' as AuthorityRole,
      title: 'Delivery Partner Portal',
      entityName: 'Ramesh Kumar (Van Fleet)',
      email: 'driver@annasetu.org',
      icon: Truck,
      color: 'dark',
      description: 'Accept nearby food rescue jobs, verify pickup OTP & tamper seal, and receive 100% fare payouts.',
    },
  ];

  const currentOptions: VerificationOption[] = VERIFICATION_OPTIONS[signupRole] || [];

  const handleRoleChangeForSignup = (role: AuthorityRole) => {
    setSignupRole(role);
    const defaultOpt = VERIFICATION_OPTIONS[role][0];
    setSelectedDocId(defaultOpt.id);
    setDocumentNumber(defaultOpt.demoValue);
  };

  // 1-Click Demo Login with immediate redirect
  const handleQuickDemoLogin = (role: AuthorityRole, entityName: string) => {
    setIsSubmitting(true);
    setSuccessFeedback(`Authenticating ${entityName}... Redirecting to ${role} Portal`);
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin(role, entityName);
    }, 450);
  };

  // Sign In submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);
    setSuccessFeedback(null);

    if (!loginEmail.trim()) {
      setErrorFeedback('Please provide your account email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const explicitRole = loginRole === 'AUTO' ? undefined : loginRole;
      const res = await realDb.loginUser(loginEmail.trim(), explicitRole);
      const userRole = (res.user.role || (loginRole !== 'AUTO' ? loginRole : 'DONOR')) as AuthorityRole;
      const entity = res.user.organization_name || res.user.full_name || 'Organization';

      setSuccessFeedback(`Welcome back, ${res.user.full_name || 'Partner'}! Redirecting to ${userRole} Portal...`);
      setTimeout(() => {
        setIsSubmitting(false);
        onLogin(userRole, entity);
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorFeedback(err.message || 'Login failed. Please check your credentials.');
    }
  };

  // Sign Up submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);
    setSuccessFeedback(null);

    if (!regFullName.trim() || !regEmail.trim() || !regOrgName.trim()) {
      setErrorFeedback('Please fill out your Name, Email, and Organization Name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await realDb.registerUser({
        role: signupRole,
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword || 'pass123',
        phone: regPhone || '+91-9876543210',
        org_name: regOrgName.trim(),
        org_address: regAddress.trim() || `${regCity}, Maharashtra`,
        city: regCity,
        document_type: selectedDocId,
        document_number: documentNumber,
      });

      const userOrg = res.user.organization_name || res.user.full_name || regOrgName;
      setSuccessFeedback(`Account created successfully! Redirecting to your ${signupRole} Portal...`);
      setTimeout(() => {
        setIsSubmitting(false);
        onLogin(signupRole, userOrg);
      }, 600);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorFeedback(err.message || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-float-up pb-12">
      {/* ── Calm Banner ── */}
      <div className="hero-warm p-7 sm:p-9 text-parchment-50 shadow-warm-lg grain-bg text-center sm:text-left">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-apple-500/20 border border-apple-400/30 text-apple-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-apple-300" />
              <span>Unified Access Gateway</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-white">
              Sign In to <span className="text-saffron-300">AnnaSetu</span>
            </h1>
            <p className="text-sm text-parchment-200/90 font-body leading-relaxed">
              Log in to automatically access your dedicated portal — whether you are a food vendor, an NGO feeding community, or a logistics rescue driver.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-3 shrink-0 sm:border-l sm:border-apple-400/25 sm:pl-6 text-left">
            <div>
              <p className="text-[10px] text-parchment-400 uppercase tracking-wider font-semibold">Rescued Food</p>
              <p className="text-lg font-display font-black text-saffron-300">
                {stats?.total_food_rescued_kg ? `${stats.total_food_rescued_kg} kg` : '1,240 kg'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-parchment-400 uppercase tracking-wider font-semibold">Meals Served</p>
              <p className="text-lg font-display font-black text-amber-200">
                {stats?.total_meals_served ? stats.total_meals_served : '2,480'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-parchment-400 uppercase tracking-wider font-semibold">Active Rescues</p>
              <p className="text-lg font-display font-black text-white">
                {stats?.active_rescues ? stats.active_rescues : '4'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-parchment-400 uppercase tracking-wider font-semibold">System Database</p>
              <p className="text-lg font-display font-black text-apple-300">Cloud Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Single Unified Authentication Card ── */}
      <div className="card-organic p-6 sm:p-9 shadow-warm space-y-6">
        {/* Mode Switcher Tabs */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1.5 p-1.5 bg-parchment-200 rounded-organic border border-clay-200 max-w-sm w-full">
            <button
              type="button"
              onClick={() => {
                setAuthTab('LOGIN');
                setErrorFeedback(null);
                setSuccessFeedback(null);
              }}
              className={`flex-1 py-2 px-4 rounded-organic-sm text-xs font-bold flex items-center justify-center gap-2 transition btn-press ${
                authTab === 'LOGIN'
                  ? 'bg-dark-850 text-white shadow-sm'
                  : 'text-clay-600 hover:text-clay-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In to Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('SIGNUP');
                setErrorFeedback(null);
                setSuccessFeedback(null);
              }}
              className={`flex-1 py-2 px-4 rounded-organic-sm text-xs font-bold flex items-center justify-center gap-2 transition btn-press ${
                authTab === 'SIGNUP'
                  ? 'bg-dark-850 text-white shadow-sm'
                  : 'text-clay-600 hover:text-clay-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create New Account</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorFeedback && (
          <div className="alert-error text-xs font-bold flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-brick-500 shrink-0" />
              <span>{errorFeedback}</span>
            </div>
            <button onClick={() => setErrorFeedback(null)} className="text-xs">✕</button>
          </div>
        )}

        {successFeedback && (
          <div className="alert-success text-xs font-bold flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-apple-600 shrink-0" />
              <span>{successFeedback}</span>
            </div>
            <button onClick={() => setSuccessFeedback(null)} className="text-xs">✕</button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MODE 1: UNIFIED SIGN IN
            ═══════════════════════════════════════════════════════════════ */}
        {authTab === 'LOGIN' && (
          <div className="space-y-7 animate-float-in">
            {/* Quick 1-Click Demo Profiles Strip */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-clay-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant 1-Click Portal Demo (Select to Test):</span>
                </span>
                <span className="text-[11px] text-clay-400 font-body">Pre-configured verified sessions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {demoAccounts.map((account) => {
                  const Icon = account.icon;
                  return (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => handleQuickDemoLogin(account.role, account.entityName)}
                      disabled={isSubmitting}
                      className="p-4 rounded-organic border border-clay-200 bg-parchment-100 hover:bg-white hover:border-apple-400/80 text-left transition flex flex-col justify-between space-y-2 btn-press group shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-organic-sm bg-apple-600 text-white flex items-center justify-center shadow-xs">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-apple-700 bg-apple-50 px-2 py-0.5 rounded border border-apple-200">
                          {account.role}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-display font-bold text-clay-800 group-hover:text-apple-700 transition">
                          {account.title}
                        </h4>
                        <p className="text-[11px] font-medium text-clay-600 truncate mt-0.5">
                          {account.entityName}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-clay-200/60 flex items-center justify-between text-[11px] font-bold text-apple-600 group-hover:text-apple-700">
                        <span>Enter Portal</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-clay-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-clay-400 uppercase tracking-wider absolute">
                Or Sign In with Email
              </span>
            </div>

            {/* Standard Email / Password Form */}
            <form onSubmit={handleSignIn} className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-xs font-bold text-clay-700 mb-1">Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-clay-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. director@tajkitchens.com"
                    className="input-warm pl-10 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-clay-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-clay-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-warm pl-10 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-clay-700 mb-1">
                  Destination Portal
                </label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as any)}
                  className="input-warm text-xs"
                >
                  <option value="AUTO">✨ Auto-Detect Role from Account</option>
                  <option value="DONOR">🍱 Restaurant &amp; Food Vendor Portal</option>
                  <option value="NGO">🤝 NGO &amp; Hunger Relief Portal</option>
                  <option value="DRIVER">🚚 Delivery Partner Portal</option>
                </select>
                <p className="text-[10px] text-clay-400 mt-1 font-body">
                  You will be automatically redirected to your designated portal upon login.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-terra btn-press w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In & Redirect to Portal'}</span>
              </button>

              <p className="text-center text-xs text-clay-500 pt-2 font-body">
                Need to create a new organization account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthTab('SIGNUP')}
                  className="font-bold text-apple-600 hover:underline"
                >
                  Register here
                </button>
              </p>
            </form>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MODE 2: UNIFIED SIGN UP & REGISTRATION
            ═══════════════════════════════════════════════════════════════ */}
        {authTab === 'SIGNUP' && (
          <form onSubmit={handleSignUp} className="space-y-6 animate-float-in">
            {/* Step 1: Role Selection */}
            <div>
              <label className="block text-xs font-bold text-clay-700 mb-2">
                1. Select Your Organization Type (Determines Portal Access):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'DONOR' as AuthorityRole,
                    label: 'Restaurant / Food Vendor',
                    desc: 'Hotels, Banquets, Caterers',
                    icon: Utensils,
                  },
                  {
                    id: 'NGO' as AuthorityRole,
                    label: 'NGO / Charity Beneficiary',
                    desc: 'Shelters, Feeding Programs',
                    icon: HeartHandshake,
                  },
                  {
                    id: 'DRIVER' as AuthorityRole,
                    label: 'Delivery Partner',
                    desc: 'Commercial Vans & Couriers',
                    icon: Truck,
                  },
                ].map((item) => {
                  const isSelected = signupRole === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleRoleChangeForSignup(item.id)}
                      className={`p-3.5 rounded-organic border text-left transition flex items-center gap-3 btn-press ${
                        isSelected
                          ? 'bg-dark-850 text-white border-apple-400 shadow-sm ring-2 ring-apple-400/20'
                          : 'bg-parchment-100 hover:bg-white border-clay-200 text-clay-800'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-organic-sm flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-apple-600 text-white' : 'bg-parchment-200 text-clay-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{item.label}</p>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-parchment-300' : 'text-clay-500'}`}>
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Information Inputs */}
            <div>
              <label className="block text-xs font-bold text-clay-700 mb-2">
                2. Organization &amp; Representative Credentials:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-clay-700 mb-1">
                    Representative Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Vikram Oberoi"
                    className="input-warm text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-clay-700 mb-1">
                    Account Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. vikram@tajkitchens.com"
                    className="input-warm text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-clay-700 mb-1">
                    {signupRole === 'DRIVER' ? 'Vehicle Fleet / Carrier Name *' : 'Organization Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={regOrgName}
                    onChange={(e) => setRegOrgName(e.target.value)}
                    placeholder={
                      signupRole === 'DONOR'
                        ? 'Taj Grand Banquets'
                        : signupRole === 'NGO'
                        ? 'Mumbai Food & Relief Trust'
                        : 'Ramesh Cargo Express'
                    }
                    className="input-warm text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-clay-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="input-warm text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-clay-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    className="input-warm text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-clay-700 mb-1">Operating City</label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Mumbai"
                    className="input-warm text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[11px] font-bold text-clay-700 mb-1">
                Kitchen / Center Address
              </label>
              <input
                type="text"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="Apollo Bunder, Colaba, Mumbai, Maharashtra"
                className="input-warm text-xs"
              />
            </div>

            {/* Statutory Compliance Identifier */}
            <div className="p-4 rounded-organic bg-parchment-100 border border-clay-200 space-y-2">
              <label className="block text-xs font-bold text-clay-700">
                3. Statutory Credential / License Number
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="input-warm text-xs"
                >
                  {currentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="License or Registration ID"
                  className="input-warm font-mono text-xs font-bold"
                />
              </div>
              <p className="text-[10px] text-clay-400 font-body">
                Required for Good Samaritan legal indemnity and verified rescue operations.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-clay-200">
              <button
                type="button"
                onClick={() => setAuthTab('LOGIN')}
                className="text-xs font-bold text-clay-500 hover:text-clay-800"
              >
                Already have an account? Sign in
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-terra btn-press px-6 py-2.5 text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Registering...' : `Create Account & Enter ${signupRole} Portal`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
