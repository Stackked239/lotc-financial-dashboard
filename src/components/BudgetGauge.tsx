import { formatCurrency, formatPercent } from '../utils/formatters';

interface BudgetGaugeProps {
  label: string;
  actual: number;
  budget: number;
  isExpense?: boolean;
}

export default function BudgetGauge({ label, actual, budget, isExpense = false }: BudgetGaugeProps) {
  const percent = budget !== 0 ? (actual / budget) * 100 : 0;
  const capped = Math.min(percent, 100);

  let barColor = 'bg-emerald-500';
  if (isExpense) {
    if (percent > 105) barColor = 'bg-rose-500';
    else if (percent > 90) barColor = 'bg-amber-500';
  } else {
    if (percent < 75) barColor = 'bg-rose-500';
    else if (percent < 95) barColor = 'bg-amber-500';
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700 truncate">{label}</span>
        <span className="text-slate-500 ml-2 whitespace-nowrap">
          {formatPercent(percent)}
        </span>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${capped}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{formatCurrency(actual, true)} actual</span>
        <span>{formatCurrency(budget, true)} budget</span>
      </div>
    </div>
  );
}
