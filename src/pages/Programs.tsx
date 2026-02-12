import { useMemo, useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import ProgramCard from '../components/ProgramCard';
import { ProgramPerformance } from '../data/types';
import { prorateBudget } from '../utils/formatters';

type SortOption = 'name' | 'revenue' | 'expenses' | 'net' | 'budget-pct';

export default function Programs() {
  const { programs, yearFilter, ytdMonths2026 } = useFinancial();
  const [sort, setSort] = useState<SortOption>('name');

  // Pro-rate 2026 budgets to YTD period at render time
  const proratedPrograms = useMemo(() => {
    return programs.map(p => {
      const budgetMonths = p.year === 2026 ? ytdMonths2026 : 12;
      const revBudget = prorateBudget(p.revenue.budget, budgetMonths);
      const expBudget = prorateBudget(p.expenses.budget, budgetMonths);
      const totalBudget = revBudget + expBudget;
      const totalActual = p.revenue.actual + p.expenses.actual;
      return {
        ...p,
        revenue: { actual: p.revenue.actual, budget: revBudget },
        expenses: { actual: p.expenses.actual, budget: expBudget },
        percentOfBudget: totalBudget !== 0 ? (totalActual / totalBudget) * 100 : 0,
      };
    });
  }, [programs, ytdMonths2026]);

  const filtered = useMemo(() => {
    let result = proratedPrograms;
    if (yearFilter !== 'both') {
      result = result.filter(p => p.year === yearFilter);
    }

    switch (sort) {
      case 'revenue':
        return [...result].sort((a, b) => b.revenue.actual - a.revenue.actual);
      case 'expenses':
        return [...result].sort((a, b) => b.expenses.actual - a.expenses.actual);
      case 'net':
        return [...result].sort((a, b) => b.net - a.net);
      case 'budget-pct':
        return [...result].sort((a, b) => b.percentOfBudget - a.percentOfBudget);
      default:
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [proratedPrograms, yearFilter, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-black">Program Performance</h2>
          <p className="text-brand-grey mt-1">
            {filtered.length} programs • How each program is doing financially
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Sort by:</label>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-slate-800"
          >
            <option value="name">Name</option>
            <option value="revenue">Revenue</option>
            <option value="expenses">Expenses</option>
            <option value="net">Net Position</option>
            <option value="budget-pct">Budget %</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((program, idx) => (
            <ProgramCard key={`${program.name}-${program.year}-${idx}`} program={program} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-slate-500">No program data available for the selected year.</p>
        </div>
      )}

      {/* What this means section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-2">What This Means</h3>
        <div className="text-sm text-slate-600 space-y-2">
          <p>
            Each card shows how a program is performing against its financial plan.
            <strong className="text-emerald-600"> Green</strong> means on track,
            <strong className="text-amber-600"> yellow</strong> means approaching limits, and
            <strong className="text-rose-600"> red</strong> means attention needed.
          </p>
          <p>
            <strong>Revenue progress bars</strong> show how much funding has been raised versus the goal.
            <strong> Expense progress bars</strong> show how much has been spent versus the approved budget.
          </p>
          <p>
            <strong>Net Position</strong> is the difference between money raised and money spent.
            A positive number means the program has raised more than it spent.
          </p>
        </div>
      </div>
    </div>
  );
}
