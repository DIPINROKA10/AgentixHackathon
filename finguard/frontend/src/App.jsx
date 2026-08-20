import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import Rings from './pages/Rings';
import ConsumerAlert from './pages/ConsumerAlert';

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
        <path d="M3 13h4v8H3zM10 8h4v13h-4zM17 3h4v18h-4z" />
      </svg>
    ),
  },
  {
    to: '/cases',
    label: 'Cases',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
        <path d="M12 2 21 20H3Z" /><path d="M12 9v5M12 17h.01" />
      </svg>
    ),
  },
  {
    to: '/rings',
    label: 'Fraud Rings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    to: '/consumer',
    label: 'Consumer Alert',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-body)' }}>
        <aside className="w-[252px] flex-shrink-0 flex flex-col glass-solid" style={{ borderRight: '1px solid var(--border-solid)' }}>
          <div className="px-5 pt-7 pb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-[26px] h-[26px] flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                  <path d="M12 2 L21 6 V12 C21 17 17 21 12 22 C7 21 3 17 3 12 V6 Z" stroke="#2563eb" strokeWidth="1.6" fill="rgba(37,99,235,0.08)" />
                  <path d="M8 12.5 L10.5 15 L16 9" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-display text-[19px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>FinGuard</span>
            </div>
            <span className="font-mono text-[10.5px] tracking-[0.08em] uppercase ml-[36px] mt-0.5 block" style={{ color: 'var(--text-muted)' }}>Fraud Intelligence</span>
          </div>

          <nav className="flex-1 px-3 space-y-0.5">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 ${
                    isActive ? '' : ''
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(37, 99, 235, 0.15)' : '1px solid transparent',
                  color: isActive ? '#2563eb' : 'var(--text-secondary)',
                })}
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border-solid)' }}>
            <div className="flex items-center gap-2">
              <span className="w-[6px] h-[6px] rounded-full bg-blue-500 animate-pulse-live"></span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>System Monitoring</span>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto" style={{ background: 'var(--bg-main)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/rings" element={<Rings />} />
            <Route path="/consumer" element={<ConsumerAlert />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
