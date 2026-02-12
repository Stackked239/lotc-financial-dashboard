import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useFinancial } from '../context/FinancialContext';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { formatCurrency, tooltipFmt, prorateBudget } from '../utils/formatters';
import { COLORS } from '../utils/colors';
import { getFilteredMonthly } from '../utils/kpiCalculations';
import { LineItem } from '../data/types';

export default function BudgetAnalysis() {
  const { monthly, yearFilter, mothership2025, mothership2026, ytdMonths2026 } = useFinancial();
  const [section, setSection] = useState<'revenue' | 'expense' | 'all'>('all');
  const ms = yearFilter === 2026 ? mothership2026 : mothership2025;
  const budgetMonths = yearFilter === 2026 ? ytdMonths2026 : 12;
  const filtered = useMemo(() => getFilteredMonthly(monthly, yearFilter), [monthly, yearFilter]);

  // Pro-rate line item budgets to YTD period
  const proratedItems: LineItem[] = useMemo(() => {
    return ms.lineItems.map(li => {
      const budget = prorateBudget(li.budget, budgetMonths);
      return {
        ...li,
        budget,
        variance: li.actual - budget,
        percentOfBudget: budget !== 0 ? (li.actual / budget) * 100 : 0,
      };
    });
  }, [ms.lineItems, budgetMonths]);

  // Cumulative variance over time
  const varianceTrend = useMemo(() => {
    let cumRevVariance = 0;
    let cumExpVariance = 0;
    return filtered.map(m => {
      const revVariance = m.revenue.actual - m.revenue.budget;
      const expVariance = m.expenses.actual - m.expenses.budget;
      cumRevVariance += revVariance;
      cumExpVariance += expVariance;
      return {
        name: m.label,
        'Revenue Variance': cumRevVariance,
        'Expense Variance': cumExpVariance,
        'Net Variance': cumRevVariance - cumExpVariance,
      };
    });
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-black">Budget vs Actual Analysis</h2>
        <p className="text-brand-grey mt-1">
          Detailed line-item comparison of actual results against budget
          {budgetMonths < 12 && ` (budget pro-rated to ${budgetMonths} months)`}
        </p>
      </div>

      {/* Variance trend */}
      {varianceTrend.some(v => v['Revenue Variance'] !== 0 || v['Expense Variance'] !== 0) && (
        <ChartCard title="Cumulative Variance Trend" subtitle="Running total of budget variance over time">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={varianceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={tooltipFmt} />
              <Legend />
              <Line type="monotone" dataKey="Revenue Variance" stroke={COLORS.brandBlue} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Expense Variance" stroke={COLORS.brandRed} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Net Variance" stroke={COLORS.emerald} strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Filter tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          {(['all', 'revenue', 'expense'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                section === s
                  ? 'bg-brand-red/10 text-brand-red'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {s === 'all' ? 'All Items' : s === 'revenue' ? 'Revenue' : 'Expenses'}
            </button>
          ))}
        </div>

        <DataTable items={proratedItems} section={section} />
      </div>

      {/* What this means */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-brand-black mb-2">Reading This Table</h3>
        <div className="text-sm text-slate-600 space-y-2">
          <p>
            <strong>Variance</strong> shows the dollar difference between what actually happened and what was planned.
            For revenue, positive variance (green) is good — it means we earned more than expected.
            For expenses, negative variance (green) is good — it means we spent less than planned.
          </p>
          <p>
            <strong>% of Budget</strong> shows actual as a percentage of the budgeted amount.
            Traffic light indicators help you quickly spot items that need attention.
          </p>
        </div>
      </div>
    </div>
  );
}
