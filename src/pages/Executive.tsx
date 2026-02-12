import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import { DollarSign, CreditCard, PiggyBank, Activity } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import { formatCurrency, tooltipFmt, prorateBudget } from '../utils/formatters';
import { COLORS, CHART_COLORS } from '../utils/colors';
import {
  getTotalRevenue, getTotalExpenses, getNetSurplus, getBudgetHealth,
  getFilteredMonthly, getYoYGrowth, getAnnualizedProjection
} from '../utils/kpiCalculations';

export default function Executive() {
  const { monthly, yearFilter, mothership2025, mothership2026, ytdMonths2026 } = useFinancial();
  // For 2026, pro-rate annual budgets to YTD months; 2025 is full year
  const budgetMonths = yearFilter === 2026 ? ytdMonths2026 : 12;

  const revenue = useMemo(() => getTotalRevenue(monthly, yearFilter), [monthly, yearFilter]);
  const expenses = useMemo(() => getTotalExpenses(monthly, yearFilter), [monthly, yearFilter]);
  const surplus = useMemo(() => getNetSurplus(monthly, yearFilter), [monthly, yearFilter]);
  const budgetHealth = useMemo(() => getBudgetHealth(monthly, yearFilter), [monthly, yearFilter]);
  const yoyGrowth = useMemo(() => getYoYGrowth(monthly), [monthly]);
  const projection = useMemo(() => getAnnualizedProjection(monthly), [monthly]);

  const filtered = useMemo(() => getFilteredMonthly(monthly, yearFilter), [monthly, yearFilter]);

  // Monthly trend data
  const trendData = useMemo(() =>
    filtered.map(m => ({
      name: m.label,
      revenue: m.revenue.actual,
      expenses: m.expenses.actual,
      net: m.revenue.actual - m.expenses.actual,
      budget: m.revenue.budget,
    })), [filtered]);

  // Year comparison data
  const comparisonData = useMemo(() => {
    const rev2025 = getTotalRevenue(monthly, 2025);
    const exp2025 = getTotalExpenses(monthly, 2025);
    const rev2026 = getTotalRevenue(monthly, 2026);
    const exp2026 = getTotalExpenses(monthly, 2026);

    return [
      { name: 'Revenue', 'FY 2025': rev2025.actual, 'FY 2026 YTD': rev2026.actual, 'FY 2026 Projected': projection },
      { name: 'Expenses', 'FY 2025': exp2025.actual, 'FY 2026 YTD': exp2026.actual },
      { name: 'Surplus', 'FY 2025': rev2025.actual - exp2025.actual, 'FY 2026 YTD': rev2026.actual - exp2026.actual },
    ];
  }, [monthly, projection]);

  // Insights
  const insights = useMemo(() => {
    const ms = yearFilter === 2026 ? mothership2026 : mothership2025;
    const goingWell: string[] = [];
    const watchList: string[] = [];
    const actionNeeded: string[] = [];

    for (const dept of ms.departments.filter(d => d.name !== 'Administrative')) {
      const revItems = dept.lineItems.filter(li => li.section === 'revenue' && !li.isTotal);
      const expItems = dept.lineItems.filter(li => li.section === 'expense' && !li.isTotal);
      const totalRev = revItems.reduce((s, li) => s + li.actual, 0);
      const totalRevBudget = revItems.reduce((s, li) => s + prorateBudget(li.budget, budgetMonths), 0);
      const totalExp = expItems.reduce((s, li) => s + li.actual, 0);
      const totalExpBudget = expItems.reduce((s, li) => s + prorateBudget(li.budget, budgetMonths), 0);

      if (totalRevBudget > 0 && totalRev > totalRevBudget * 1.1) {
        goingWell.push(`${dept.name}: Revenue at ${Math.round((totalRev / totalRevBudget) * 100)}% of YTD goal`);
      }
      if (totalExpBudget > 0 && totalExp > totalExpBudget * 0.9) {
        watchList.push(`${dept.name}: Spending at ${Math.round((totalExp / totalExpBudget) * 100)}% of YTD budget`);
      }
      if (totalRevBudget > 0 && totalRev < totalRevBudget * 0.5 && totalRevBudget > 1000) {
        actionNeeded.push(`${dept.name}: Only ${Math.round((totalRev / totalRevBudget) * 100)}% of YTD revenue goal`);
      }
    }

    return { goingWell: goingWell.slice(0, 3), watchList: watchList.slice(0, 3), actionNeeded: actionNeeded.slice(0, 3) };
  }, [yearFilter, mothership2025, mothership2026, budgetMonths]);

  // Program spending for horizontal bar
  const programSpending = useMemo(() => {
    const ms = yearFilter === 2026 ? mothership2026 : mothership2025;
    return ms.departments
      .filter(d => !['Administrative', 'Support Services'].includes(d.name))
      .map(d => ({
        name: d.name,
        spending: d.lineItems.filter(li => li.section === 'expense' && !li.isTotal).reduce((s, li) => s + li.actual, 0),
      }))
      .filter(d => d.spending > 0)
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 10);
  }, [yearFilter, mothership2025, mothership2026]);

  const expBudgetPct = expenses.budget > 0 ? ((expenses.actual / expenses.budget) * 100).toFixed(0) : '—';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-black">Executive Summary</h2>
        <p className="text-brand-grey mt-1">
          {yearFilter === 'both' ? 'FY 2025–2026' : yearFilter === 2026 ? `FY 2026 YTD (Jan–Feb)` : `Fiscal Year 2025`} Overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(revenue.actual, true)}
          icon={<DollarSign size={18} />}
          tooltip="Total money received from all sources including donations, grants, and fundraising"
          color="sky"
          trend={yearFilter === 2025 ? { value: yoyGrowth, label: 'YoY' } : undefined}
          subtitle={revenue.budget > 0 ? `${budgetMonths < 12 ? 'YTD ' : ''}Budget: ${formatCurrency(revenue.budget, true)}` : undefined}
        />
        <KPICard
          title="Total Expenses"
          value={formatCurrency(expenses.actual, true)}
          icon={<CreditCard size={18} />}
          tooltip="Total costs including personnel, programs, professional fees, and operations"
          color="amber"
          subtitle={`${expBudgetPct}% of ${budgetMonths < 12 ? 'YTD ' : ''}budget utilized`}
        />
        <KPICard
          title="Net Surplus"
          value={formatCurrency(surplus, true)}
          icon={<PiggyBank size={18} />}
          tooltip="Money left over after all bills — Revenue minus Expenses"
          color={surplus >= 0 ? 'emerald' : 'rose'}
          subtitle={surplus >= 0 ? 'Healthy surplus' : 'Running a deficit'}
        />
        <KPICard
          title="Budget Health"
          value={`${budgetHealth.toFixed(0)}/100`}
          icon={<Activity size={18} />}
          tooltip="How close actual spending and revenue are to the planned budget (100 = perfect match)"
          color={budgetHealth >= 80 ? 'emerald' : budgetHealth >= 60 ? 'amber' : 'rose'}
          subtitle={budgetHealth >= 80 ? 'Tracking well' : budgetHealth >= 60 ? 'Some variance' : 'Significant variance'}
        />
      </div>

      {/* Year Comparison */}
      <ChartCard
        title="Year-over-Year Comparison"
        subtitle={projection > 0 ? `Based on current pace, projected FY 2026 revenue: ${formatCurrency(projection, true)}` : undefined}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
            <Tooltip formatter={tooltipFmt} />
            <Legend />
            <Bar dataKey="FY 2025" fill={COLORS.brandBlack} radius={[4, 4, 0, 0]} />
            <Bar dataKey="FY 2026 YTD" fill={COLORS.brandRed} radius={[4, 4, 0, 0]} />
            {projection > 0 && <Bar dataKey="FY 2026 Projected" fill={COLORS.brandBlue} radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
          <h3 className="font-semibold text-emerald-800 text-sm mb-2 uppercase tracking-wide">What's Going Well</h3>
          {insights.goingWell.length > 0 ? (
            <ul className="space-y-1.5">
              {insights.goingWell.map((item, i) => (
                <li key={i} className="text-sm text-emerald-700 flex items-start gap-1.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-emerald-600 italic">No standout performers yet</p>
          )}
        </div>

        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <h3 className="font-semibold text-amber-800 text-sm mb-2 uppercase tracking-wide">Watch List</h3>
          {insights.watchList.length > 0 ? (
            <ul className="space-y-1.5">
              {insights.watchList.map((item, i) => (
                <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-amber-600 italic">Nothing flagged</p>
          )}
        </div>

        <div className="bg-rose-50 rounded-xl border border-rose-200 p-4">
          <h3 className="font-semibold text-rose-800 text-sm mb-2 uppercase tracking-wide">Action Needed</h3>
          {insights.actionNeeded.length > 0 ? (
            <ul className="space-y-1.5">
              {insights.actionNeeded.map((item, i) => (
                <li key={i} className="text-sm text-rose-700 flex items-start gap-1.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-rose-600 italic">No urgent items</p>
          )}
        </div>
      </div>

      {/* Bottom Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Revenue Trend" subtitle="Actual revenue over time">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={tooltipFmt} />
              <Area type="monotone" dataKey="revenue" stroke={COLORS.brandRed} fill={COLORS.brandRed} fillOpacity={0.15} strokeWidth={2} />
              {filtered.some(m => m.revenue.budget > 0) && (
                <Area type="monotone" dataKey="budget" stroke={COLORS.brandGrey} fill="none" strokeDasharray="5 5" strokeWidth={1.5} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Program Spending" subtitle="Top programs by expenditure">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={programSpending} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={tooltipFmt} />
              <Bar dataKey="spending" fill={COLORS.brandBlue} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
