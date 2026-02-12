import { ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, DollarSign, CreditCard, Users, BarChart3,
  TrendingUp, Menu, X, Heart
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import YearFilter from './YearFilter';

const navItems = [
  { to: '/', label: 'Executive Summary', icon: LayoutDashboard },
  { to: '/revenue', label: 'Revenue', icon: DollarSign },
  { to: '/expenses', label: 'Expenses', icon: CreditCard },
  { to: '/programs', label: 'Programs', icon: Users },
  { to: '/budget', label: 'Budget Analysis', icon: BarChart3 },
  { to: '/trends', label: 'Trends', icon: TrendingUp },
  { to: '/donations-social', label: 'Donations & Social', icon: Heart },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { yearFilter, setYearFilter, isLoading } = useFinancial();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar — brand blue */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-blue transform transition-transform duration-200 lg:translate-x-0 lg:static lg:flex-shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-white/20">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="LOTC" className="w-10 h-10 rounded-lg" />
              <div>
                <h1 className="font-bold text-white text-sm">LOTC Financial</h1>
                <p className="text-xs text-white/70">Dashboard</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-brand-red font-semibold'
                      : 'text-white/90 hover:bg-white/15 hover:text-white'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-white/20">
            <p className="text-xs text-white/80 font-medium">Least of These Carolinas</p>
            <p className="text-xs text-white/60">Serving Foster Care Children</p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <YearFilter value={yearFilter} onChange={setYearFilter} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-slate-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500">Loading financial data...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
