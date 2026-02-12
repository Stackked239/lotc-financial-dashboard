import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { CreditCard, Users, Building, Percent } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import BudgetGauge from '../components/BudgetGauge';
import { formatCurrency, formatPercent, tooltipFmt, prorateBudget } from '../utils/formatters';
import { COLORS, CHART_COLORS } from '../utils/colors';
import {
  getTotalExpenses, getFilteredMonthly, getPersonnelRatio,
  getProgramSpendRatio, getAdminOverhead
} from '../utils/kpiCalculations';

export default function Expenses() {
  const { monthly, yearFilter, mothership2025, mothership2026, ytdMonths2026 } = useFinancial();
  const filtered = useMemo(() => getFilteredMonthly(monthly, yearFilter), [monthly, yearFilter]);
  const expenses = useMemo(() => getTotalExpenses(monthly, yearFilter), [monthly, yearFilter]);
  const ms = yearFilter === 2026 ? mothership2026 : mothership2025;
  const budgetMonths = yearFilter === 2026 ? ytdMonths2026 : 12;

  const personnelRatio = useMemo(() => getPersonnelRatio(ms), [ms]);
  const programRatio = useMemo(() => getProgramSpendRatio(ms), [ms]);
  const adminOverhead = useMemo(() => getAdminOverhead(ms), [ms]);

  // Expense trend
  const trendData = useMemo(() =>
    filtered.map(m => ({
      name: m.label,
      actual: m.expenses.actual,
      budget: m.expenses.budget,
    })), [filtered]);

  // Expense category breakdown from monthly totals
  const expenseBreakdown = useMemo(() => {
    const cats = new Map<string, number>();
    for (const li of ms.lineItems) {
      if (li.section !== 'expense' || !li.isTotal) continue;
      const name = li.name.replace(/^Total /, '').replace(/^\d{3,5}\s+/, '');
      if (li.actual > 0) {
        cats.set(name, (cats.get(name) || 0) + li.actual);
      }
    }
    const sorted = Array.from(cats.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const total = sorted.reduce((s, c) => s + c.value, 0);
    const significant: typeof sorted = [];
    let otherSum = 0;
    for (const item of sorted) {
      if (item.value / total >= 0.05) {
        significant.push(item);
      } else {
        otherSum += item.value;
      }
    }
    if (otherSum > 0) significant.push({ name: 'Other', value: otherSum });
    return significant;
  }, [ms]);

  // Budget utilization by major category (pro-rated to YTD)
  const budgetUtilization = useMemo(() => {
    return ms.lineItems
      .filter(li => li.section === 'expense' && li.isTotal && li.budget > 0)
      .map(li => ({
        name: li.name.replace(/^Total /, '').replace(/^\d{3,5}\s+/, ''),
        actual: li.actual,
        budget: prorateBudget(li.budget, budgetMonths),
      }))
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 8);
  }, [ms, budgetMonths]);

  // Top spending categories
  const topSpending = useMemo(() => {
    return ms.lineItems
      .filter(li => li.section === 'expense' && !li.isTotal && li.actual > 0)
      .sort((a, b) => b.actual - a.actual)
      .slice(0, 10)
      .map(li => {
        const clean = li.name.replace(/^\d{3,5}\s+/, '');
        return { name: clean.length > 30 ? clean.slice(0, 28) + '...' : clean, spending: li.actual };
      });
  }, [ms]);

  // MoM comparison
  const momData = useMemo(() => {
    if (filtered.length < 2) return [];
    return filtered.map((m, i) => ({
      name: m.label,
      expenses: m.expenses.actual,
      change: i > 0 ? m.expenses.actual - filtered[i - 1].expenses.actual : 0,
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-black">Expense Overview</h2>
        <p className="text-brand-grey mt-1">Where the money goes</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Expenses"
          value={formatCurrency(expenses.actual, true)}
          icon={<CreditCard size={18} />}
          color="amber"
          tooltip="Total costs including personnel, programs, and operations"
          subtitle={expenses.budget > 0 ? `${formatPercent((expenses.actual / expenses.budget) * 100)} of ${budgetMonths < 12 ? 'YTD ' : ''}budget` : undefined}
        />
        <KPICard
          title="Personnel Cost"
          value={formatPercent(personnelRatio)}
          icon={<Users size={18} />}
          color="navy"
          tooltip="What percentage of total expenses goes to staff salaries and benefits"
        />
        <KPICard
          title="Program Spend"
          value={formatPercent(programRatio)}
          icon={<Building size={18} />}
          color="sky"
          tooltip="What percentage of expenses directly helps children through programs"
        />
        <KPICard
          title="Admin Overhead"
          value={formatPercent(adminOverhead)}
          icon={<Percent size={18} />}
          color={adminOverhead < 20 ? 'emerald' : 'amber'}
          tooltip="What percentage goes to running the office — lower is generally better"
        />
      </div>

      {/* Expense trend */}
      <ChartCard title="Monthly Expense Trend" subtitle="Actual spending vs budget">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
            <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
            <Tooltip formatter={tooltipFmt} />
            <Legend />
            <Area type="monotone" dataKey="actual" name="Actual" stroke={COLORS.brandRed} fill={COLORS.brandRed} fillOpacity={0.1} strokeWidth={2} />
            <Area type="monotone" dataKey="budget" name="Budget" stroke={COLORS.brandGrey} fill="none" strokeDasharray="5 5" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <ChartCard title="Expense Categories" subtitle="Where money is allocated">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={expenseBreakdown}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={false}
              >
                {expenseBreakdown.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFmt} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => <span className="text-xs text-slate-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Budget gauges */}
        <ChartCard title="Budget Utilization" subtitle="How much of each budget has been used">
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {budgetUtilization.map(item => (
              <BudgetGauge
                key={item.name}
                label={item.name}
                actual={item.actual}
                budget={item.budget}
                isExpense
              />
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Top spending */}
      <ChartCard title="Top Spending Line Items" subtitle="Individual expense items ranked by amount">
        <ResponsiveContainer width="100%" height={Math.max(250, topSpending.length * 35)}>
          <BarChart data={topSpending} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
            <Tooltip formatter={tooltipFmt} />
            <Bar dataKey="spending" fill={COLORS.brandBlue} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
