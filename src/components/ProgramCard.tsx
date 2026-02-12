import { ProgramPerformance } from '../data/types';
import { formatCurrency } from '../utils/formatters';
import StatusBadge from './StatusBadge';
import BudgetGauge from './BudgetGauge';
import { Heart } from 'lucide-react';

interface ProgramCardProps {
  program: ProgramPerformance;
}

export default function ProgramCard({ program }: ProgramCardProps) {
  const revPercent = program.revenue.budget !== 0
    ? (program.revenue.actual / program.revenue.budget) * 100 : 0;
  const expPercent = program.expenses.budget !== 0
    ? (program.expenses.actual / program.expenses.budget) * 100 : 0;

  const netPosition = program.revenue.actual - program.expenses.actual;

  // Generate a plain-language summary
  let summary = '';
  if (program.revenue.budget > 0 && revPercent > 0) {
    if (revPercent > 100) {
      summary = `${program.name} has raised ${Math.round(revPercent)}% of its goal!`;
    } else {
      summary = `${program.name} is at ${Math.round(revPercent)}% of its fundraising goal.`;
    }
  } else if (program.expenses.actual > 0) {
    summary = `${program.name} has spent ${formatCurrency(program.expenses.actual, true)} so far.`;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
            <Heart size={16} className="text-brand-red" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{program.name}</h3>
            <span className="text-xs text-slate-500">FY {program.year}</span>
          </div>
        </div>
        <StatusBadge
          percent={revPercent || expPercent}
          isExpense={program.revenue.budget === 0}
        />
      </div>

      <div className="space-y-3">
        {(program.revenue.actual !== 0 || program.revenue.budget !== 0) && (
          <BudgetGauge
            label="Revenue"
            actual={program.revenue.actual}
            budget={program.revenue.budget}
          />
        )}
        {(program.expenses.actual !== 0 || program.expenses.budget !== 0) && (
          <BudgetGauge
            label="Expenses"
            actual={program.expenses.actual}
            budget={program.expenses.budget}
            isExpense
          />
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Net Position</span>
          <span className={`text-sm font-bold ${netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(netPosition, true)}
          </span>
        </div>
        {summary && (
          <p className="text-xs text-slate-500 mt-2 italic">{summary}</p>
        )}
      </div>
    </div>
  );
}
