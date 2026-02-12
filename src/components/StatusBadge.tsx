interface StatusBadgeProps {
  percent: number;
  isExpense?: boolean;
}

export default function StatusBadge({ percent, isExpense = false }: StatusBadgeProps) {
  let color = 'bg-emerald-500';
  let label = 'On Track';

  if (isExpense) {
    if (percent > 105) { color = 'bg-rose-500'; label = 'Over Budget'; }
    else if (percent > 90) { color = 'bg-amber-500'; label = 'Watch'; }
  } else {
    if (percent < 75) { color = 'bg-rose-500'; label = 'Behind'; }
    else if (percent < 95) { color = 'bg-amber-500'; label = 'Watch'; }
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-slate-600">{label}</span>
    </span>
  );
}
