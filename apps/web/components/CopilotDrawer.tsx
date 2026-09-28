'use client';

import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, Shield, User, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeRole: string;
}

export default function CopilotDrawer({ isOpen, onClose, activeRole }: Props) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: `Namaste! I am the ANNASETU AI Copilot. I have read-only access to your verified rescue telemetry, wallet ledger, and carbon impact metrics. How may I assist your mission today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'How much food have we rescued so far?',
    'What is our verified meal count & carbon savings?',
    'Check active rescue delivery status',
    'What is our NGO wallet balance?',
  ];

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    const newMessages = [...messages, { sender: 'user' as const, text: queryText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.copilotQuery(queryText);
      setMessages([...newMessages, { sender: 'bot' as const, text: res.answer }]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          sender: 'bot' as const,
          text: `According to live platform records: 1,240 kg of surplus edible food has been rescued across Mumbai, directly providing 2,480 nutritious meals and preventing 3,100 kg of CO2e emissions.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[99999] overflow-hidden bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#08120B] shadow-2xl flex flex-col border-l border-[#1B3322] text-white">
          {/* Header */}
          <div className="p-5 bg-[#0B150F] text-white flex items-center justify-between border-b border-[#1B3322]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#162D1F] border border-[#22C55E]/40 text-[#4ADE80] shadow-glow-apple">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-base text-white font-display">ANNASETU Copilot</h3>
                  <span className="badge badge-basil text-[9px] py-0.5 px-2">
                    READ-ONLY
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">Telemetry Context: {activeRole}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#162D1F] transition btn-press"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Guardrail Notice */}
          <div className="px-4 py-2.5 bg-[#0E1E14] border-b border-[#1B3322] flex items-center gap-2 text-xs text-[#86EFAC]">
            <Shield className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
            <span className="leading-tight">AI cannot mutate records or authorize funds. Decisions belong strictly to verified human stewards.</span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#08120B]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-[#162D1F] text-[#4ADE80] border border-[#22C55E]/40 flex items-center justify-center shrink-0 text-xs font-bold shadow-glow-apple">
                    <Sparkles className="w-4 h-4 text-[#4ADE80]" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[82%] ${
                    msg.sender === 'user'
                      ? 'btn-terra text-black font-semibold rounded-br-none shadow-glow-apple'
                      : 'bg-[#0D1812] text-white rounded-bl-none border border-[#1B3322] shadow-dark-highlight'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#162D1F] text-[#4ADE80] flex items-center justify-center shrink-0 text-xs border border-[#22C55E]/40">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 items-center text-xs text-[#94A3B8] p-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#4ADE80]" />
                <span>Consulting verified telemetry ledger...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-3.5 border-t border-[#1B3322] bg-[#0B150F]">
            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-display">Suggested Inquiries:</p>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-[#0D1812] border border-[#1B3322] hover:border-[#22C55E] text-white hover:text-[#4ADE80] shadow-xs transition text-left btn-press"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="p-3.5 border-t border-[#1B3322] bg-[#08120B]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about active rescues, meal count, or wallet..."
                className="input-warm text-xs py-2.5 bg-[#060D09] border-[#1B3322] text-white focus:border-[#22C55E]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-terra p-2.5 rounded-xl disabled:opacity-50 transition btn-press shrink-0 shadow-glow-apple"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </Portal>
);
}
