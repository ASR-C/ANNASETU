'use client';

import React, { useState } from 'react';
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  ShieldCheck,
  X,
  CreditCard,
  CheckCircle2,
  FileCheck,
  Building,
  HelpCircle,
  Truck,
  Server,
  ArrowRight
} from 'lucide-react';
import Portal from './Portal';

export interface SubscriptionPlan {
  id: 'STARTER' | 'PRO' | 'ENTERPRISE';
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  highlight?: boolean;
  buttonText: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'STARTER' | 'PRO' | 'ENTERPRISE';
  onSelectPlan: (tier: 'STARTER' | 'PRO' | 'ENTERPRISE', cycle: 'monthly' | 'annual') => void;
  restaurantName?: string;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentTier,
  onSelectPlan,
  restaurantName,
}: Props) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const plans: SubscriptionPlan[] = [
    {
      id: 'STARTER',
      name: 'Starter Community',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Ideal for small cafes or standalone diners getting started with food rescue.',
      features: [
        'Up to 5 surplus food listings per month',
        'Standard driver dispatch (45 min window)',
        'Basic digital pickup confirmation receipt',
        'FSSAI Good Samaritan immunity coverage',
        'Community email support'
      ],
      buttonText: currentTier === 'STARTER' ? 'Current Plan' : 'Downgrade to Starter',
    },
    {
      id: 'PRO',
      name: 'Verified Restaurant Pro',
      badge: 'Most Popular',
      monthlyPrice: 1499,
      annualPrice: 14990,
      highlight: true,
      description: 'Full-service surplus monetization, unlimited listings & priority dispatches for active kitchens.',
      features: [
        'Unlimited surplus food batches & dispatches',
        'Express priority matching (<15 min dispatch window)',
        'Instant ESG & Tax Exemption Certificates (CSR 80G)',
        'Automated FSSAI compliance & audit report log',
        'Priority temperature-controlled insulated vehicle fleet',
        '24/7 AI Copilot Food Safety & shelf-life optimizer',
        'Dedicated dispatch assistance hotline'
      ],
      buttonText: currentTier === 'PRO' ? 'Active Plan' : 'Subscribe to Pro Maintenance',
    },
    {
      id: 'ENTERPRISE',
      name: 'Chain & Hotel Banquets',
      badge: 'Commercial Fleet',
      monthlyPrice: 4999,
      annualPrice: 49990,
      description: 'Designed for hotel chains, banquet caterers, and multi-location cloud kitchens.',
      features: [
        'Everything in Restaurant Pro, plus:',
        'Multi-outlet kitchen management (up to 10 branches)',
        'Scheduled daily recurring banquet clearance pickups',
        'Board-level ESG annual sustainability audit dossier',
        'Commercial heavy truck dispatch (up to 5,000 kg/trip)',
        'Direct ERP / POS API integration & invoice sync',
        'Dedicated Key Logistics Account Manager'
      ],
      buttonText: currentTier === 'ENTERPRISE' ? 'Active Plan' : 'Upgrade to Enterprise',
    },
  ];

  const handleSubscribe = (tier: 'STARTER' | 'PRO' | 'ENTERPRISE') => {
    setProcessingTier(tier);
    setTimeout(() => {
      onSelectPlan(tier, billingCycle);
      setProcessingTier(null);
      setSuccessMsg(`Successfully updated subscription to ${tier === 'PRO' ? 'Restaurant Pro' : tier === 'ENTERPRISE' ? 'Enterprise' : 'Starter'}!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <Portal>
      <div className="modal-overlay">
      <div className="modal-panel relative max-w-4xl w-full overflow-hidden flex flex-col my-8 bg-[#08120B] border border-[#1B3322] shadow-2xl text-white">
        {/* Header */}
        <div className="bg-[#0B150F] p-6 sm:p-8 text-white flex items-center justify-between border-b border-[#1B3322] relative">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#162D1F] text-[#4ADE80] text-[11px] font-extrabold uppercase tracking-wider border border-[#22C55E]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span>Restaurant Maintenance &amp; Sustainability Subscriptions</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-display">
              Support the Food Rescue Bridge
            </h3>
            <p className="text-xs sm:text-sm text-[#CBD5E1] font-normal leading-relaxed">
              Maintenance contributions directly power high-availability cloud servers, real-time routing engines, cold-chain logistics gear, and automated ESG documentation for <strong className="text-[#4ADE80]">{restaurantName || 'your kitchen'}</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#162D1F] transition shrink-0 self-start btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-7 overflow-y-auto">
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center">
            <div className="flex items-center p-1 bg-[#060D09] rounded-2xl border border-[#1B3322]">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition btn-press ${
                  billingCycle === 'monthly'
                    ? 'bg-[#162D1F] text-[#4ADE80] border border-[#22C55E]/40 shadow-glow-apple'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Monthly Contribution
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 btn-press ${
                  billingCycle === 'annual'
                    ? 'bg-[#162D1F] text-[#4ADE80] border border-[#22C55E]/40 shadow-glow-apple'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <span>Annual Contribution</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22C55E] text-black font-black">
                  Save ~17%
                </span>
              </button>
            </div>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-[#0E1E14] border border-[#22C55E] text-[#86EFAC] text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-glow-apple">
              <CheckCircle2 className="w-5 h-5 text-[#4ADE80] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const isCurrent = currentTier === plan.id;
              const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
              const periodText = billingCycle === 'monthly' ? '/ month' : '/ year';

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 border relative ${
                    plan.highlight
                      ? 'bg-[#0E1E14] text-white border-[#22C55E] shadow-glow-apple ring-2 ring-[#4ADE80]/30'
                      : 'bg-[#0D1812] text-white border-[#1B3322] shadow-dark-highlight hover:border-[#22C55E]/60'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#22C55E] to-[#4ADE80] text-black text-[10px] font-black uppercase tracking-wider shadow-glow-apple">
                      {plan.badge}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black font-display text-white">
                          {plan.name}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-[#162D1F] text-[#4ADE80] border-[#22C55E]/40">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1 leading-relaxed text-[#94A3B8]">
                        {plan.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-dashed border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-black font-display ${plan.highlight ? 'text-[#4ADE80]' : 'text-white'}`}>
                          ₹{price.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-[#94A3B8]">
                          {price === 0 ? 'Forever Free' : periodText}
                        </span>
                      </div>
                      {billingCycle === 'annual' && price > 0 && (
                        <p className="text-[11px] mt-0.5 text-[#86EFAC] font-semibold">
                          Equivalent to ₹{Math.round(price / 12).toLocaleString()}/mo
                        </p>
                      )}
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2.5 pt-3">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs">
                          <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#4ADE80]" />
                          <span className={plan.highlight ? 'text-white' : 'text-[#CBD5E1]'}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-dashed border-white/10">
                    <button
                      type="button"
                      disabled={isCurrent || processingTier === plan.id}
                      onClick={() => handleSubscribe(plan.id)}
                      className={`w-full py-3 rounded-2xl font-extrabold text-xs transition flex items-center justify-center gap-2 btn-press ${
                        isCurrent
                          ? 'bg-white/5 text-white/40 cursor-default opacity-80 border border-white/10'
                          : plan.highlight
                          ? 'btn-terra shadow-glow-apple'
                          : 'bg-[#162D1F] hover:bg-[#1C3A27] text-[#4ADE80] border border-[#22C55E]/40'
                      }`}
                    >
                      {processingTier === plan.id ? (
                        <span>Processing Plan...</span>
                      ) : (
                        <>
                          <span>{plan.buttonText}</span>
                          {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Maintenance Fund Transparency Breakdown */}
          <div className="p-5 rounded-3xl bg-[#0D1812] border border-[#1B3322] space-y-3 shadow-dark-highlight">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#4ADE80]" />
              <h5 className="text-xs font-black uppercase tracking-wider text-white font-display">
                Where Your Maintenance Support Goes:
              </h5>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white">
              <div className="p-3.5 bg-[#08120B] rounded-2xl border border-[#1B3322]">
                <span className="font-extrabold text-[#4ADE80] font-display">40% Real-Time Infrastructure</span>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
                  High-availability databases, deterministic matching algorithms &amp; real-time driver dispatch telemetry.
                </p>
              </div>
              <div className="p-3.5 bg-[#08120B] rounded-2xl border border-[#1B3322]">
                <span className="font-extrabold text-[#86EFAC] font-display">35% Cold-Chain &amp; Supplies</span>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
                  Insulated thermal transport boxes, tamper-proof security seals, and verified driver trip incentives.
                </p>
              </div>
              <div className="p-3.5 bg-[#08120B] rounded-2xl border border-[#1B3322]">
                <span className="font-extrabold text-[#A3E635] font-display">25% Statutory &amp; ESG Auditing</span>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
                  FSSAI Good Samaritan regulatory compliance verification and certified CSR 80G tax receipt generation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#060D09] px-6 sm:px-8 py-4 border-t border-[#1B3322] flex items-center justify-between">
          <p className="text-[11px] text-[#94A3B8]">
            Automatic GST invoice generated upon plan activation. Adjust or change plan anytime.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#162D1F] hover:bg-[#1C3A27] text-[#4ADE80] border border-[#22C55E]/30 font-bold text-xs transition btn-press"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Portal>
);
}
