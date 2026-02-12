import { ReactNode, useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  tooltip?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  color?: 'emerald' | 'rose' | 'sky' | 'amber' | 'navy';
}

const colorMap = {
  emerald: 'bg-emerald-50 border-emerald-200',
  rose: 'bg-rose-50 border-rose-200',
  sky: 'bg-brand-blue/10 border-brand-blue/30',
  amber: 'bg-amber-50 border-amber-200',
  navy: 'bg-slate-50 border-slate-200',
};

const valueColorMap = {
  emerald: 'text-emerald-700',
  rose: 'text-rose-700',
  sky: 'text-brand-blue-dark',
  amber: 'text-amber-700',
  navy: 'text-brand-black',
};

export default function KPICard({ title, value, subtitle, tooltip, icon, trend, color = 'navy' }: KPICardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`rounded-xl border p-5 relative ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-500">{icon}</span>}
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h3>
        </div>
        {tooltip && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <HelpCircle size={16} />
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-6 z-50 w-64 p-3 text-sm bg-white rounded-lg shadow-lg border border-slate-200 text-slate-600">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${valueColorMap[color]}`}>{value}</div>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      {trend && (
        <div className={`text-sm mt-2 font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}% {trend.label}
        </div>
      )}
    </div>
  );
}
