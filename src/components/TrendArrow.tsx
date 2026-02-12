import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendArrowProps {
  value: number;
  label?: string;
}

export default function TrendArrow({ value, label }: TrendArrowProps) {
  if (Math.abs(value) < 0.1) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-slate-500">
        <Minus size={14} />
        <span>Flat{label ? ` ${label}` : ''}</span>
      </span>
    );
  }

  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      <span>{isPositive ? '+' : ''}{value.toFixed(1)}%{label ? ` ${label}` : ''}</span>
    </span>
  );
}
