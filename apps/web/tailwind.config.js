/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── 1. LIGHT GREEN / APPLE GREEN ── */
        apple: {
          50:  '#F0FDF4', // Very light green
          100: '#DCFCE7', // Soft light green
          200: '#BBF7D0', // Pale meadow
          300: '#86EFAC', // Crisp light green
          400: '#4ADE80', // Vibrant light apple green
          500: '#22C55E', // Apple green
          600: '#16A34A', // Rich leaf green
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        /* ── 2. BLUE ── */
        blue: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        /* ── 3. GRAY ── */
        gray: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        /* ── 4. WHITE & BLACK & DEEP SLATE ── */
        white: '#FFFFFF',
        black: '#000000',
        dark: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#334155',
          700: '#1E293B',
          800: '#111827',
          850: '#0B0F17',
          900: '#080C10',
          950: '#030708',
        },

        /* ── SEMANTIC MAPPINGS (Enforces strict palette: Apple Green, Blue, Gray, White, Black) ── */
        terra: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        basil: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#0B0F17', // Dark contrast
          700: '#080C10',
          800: '#05070A',
          900: '#000000',
        },
        saffron: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD', // Crisp light blue
          400: '#60A5FA', // Blue accent
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        mustard: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
        },
        parchment: {
          50:  '#F8FAFC', // Pure cool gray 50
          100: '#F1F5F9', // Pure cool gray 100
          200: '#E2E8F0', // Pure cool gray 200
          300: '#CBD5E1', // Border gray
          400: '#94A3B8',
          500: '#64748B',
        },
        fresh: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
        },
        brick: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
        },
        clay: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#0F172A', // Dark charcoal text
          900: '#020617',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Source Sans 3"', 'system-ui', 'sans-serif'],
        body:    ['"Source Sans 3"', '"Inter"', 'system-ui', 'sans-serif'],
        sans:    ['"Source Sans 3"', '"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'organic':   '1rem',
        'organic-lg': '1.5rem',
        'organic-sm': '0.5rem',
        'pebble':     '2rem',
      },
      boxShadow: {
        'warm-xs': '0 1px 2px rgba(15, 23, 42, 0.05)',
        'warm-sm': '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'warm':    '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
        'warm-md': '0 8px 18px -3px rgba(15, 23, 42, 0.1), 0 3px 6px rgba(15, 23, 42, 0.05)',
        'warm-lg': '0 12px 28px -6px rgba(15, 23, 42, 0.12), 0 6px 10px rgba(15, 23, 42, 0.06)',
        'warm-xl': '0 18px 36px -8px rgba(15, 23, 42, 0.16)',
        'inner-warm': 'inset 0 1px 3px rgba(15, 23, 42, 0.06)',
        'glow-terra': '0 4px 14px rgba(34, 197, 94, 0.25)',
        'glow-basil': '0 4px 14px rgba(15, 23, 42, 0.2)',
        'glow-apple': '0 4px 16px rgba(74, 222, 128, 0.25)',
        'glow-blue':  '0 4px 16px rgba(59, 130, 246, 0.25)',
      },
      keyframes: {
        'float-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'float-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px) scale(0.99)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'slide-up-modal': {
          '0%':   { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'progress-fill': {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--progress-target, 33%)' },
        },
      },
      animation: {
        'float-up':       'float-up 0.3s ease-out both',
        'float-in':       'float-in 0.25s ease-out both',
        'slide-up-modal': 'slide-up-modal 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':        'fade-in 0.2s ease-out both',
        'progress-fill':  'progress-fill 0.6s ease-out both',
      },
    },
  },
  plugins: [],
};
