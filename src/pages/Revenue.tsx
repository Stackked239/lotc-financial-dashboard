import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { DollarSign, TrendingUp, Coins, Target } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import { formatCurrency, formatPercent, tooltipFmt, prorateBudget } from '../utils/formatters';
import { COLORS, CHART_COLORS } from '../utils/colors';
import { getTotalRevenue, getFilteredMonthly, getYoYGrowth } from '../utils/kpiCalculations';

export default function Revenue() {
  const { monthly, yearFilter, mothership2025, mothership2026, ytdMonths2026 } = useFinancial();
  const filtered = useMemo(() => getFilteredMonthly(monthly, yearFilter), [monthly, yearFilter]);
  const revenue = useMemo(() => getTotalRevenue(monthly, yearFilter), [monthly, yearFilter]);
  const yoyGrowth = useMemo(() => getYoYGrowth(monthly), [monthly]);
  const ms = yearFilter === 2026 ? mothership2026 : mothership2025;
  const budgetMonths = yearFilter === 2026 ? ytdMonths2026 : 12;

  const avgMonthly = useMemo(() => {
    const monthsWithData = filtered.filter(m => m.revenue.actual > 0).length;
    return monthsWithData > 0 ? revenue.actual / monthsWithData : 0;
  }, [filtered, revenue]);

  // Revenue trend
  const trendData = useMemo(() =>
    filtered.map(m => ({
      name: m.label,
      actual: m.revenue.actual,
      budget: m.revenue.budget,
    })), [filtered]);

  // Revenue mix from mothership line items
  const revenueMix = useMemo(() => {
    const categories = new Map<string, number>();
    for (const li of ms.lineItems) {
      if (li.section !== 'revenue' || !li.isTotal) continue;
      const name = li.name.replace(/^Total /, '').replace(/^\d{3,5}\s+/, '');
      if (li.actual > 0) {
        categories.set(name, (categories.get(name) || 0) + li.actual);
      }
    }
    const sorted = Array.from(categories.entries())
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

  // In-Kind vs Cash
  const inKindVsCash = useMemo(() => {
    let inKind = 0;
    for (const li of ms.lineItems) {
      if (li.section === 'revenue' && li.name.includes('In Kind') && li.isTotal) {
        inKind += li.actual;
      }
    }
    const cash = ms.totalRevenue.actual - inKind;
    return [
      { name: 'Cash Revenue', value: cash },
      { name: 'In-Kind Donations', value: inKind },
    ].filter(c => c.value > 0);
  }, [ms]);

  // Top revenue sources by department
  const topSources = useMemo(() => {
    return ms.departments
      .map(d => ({
        name: d.name,
        revenue: d.lineItems.filter(li => li.section === 'revenue' && !li.isTotal).reduce((s, li) => s + li.actual, 0),
      }))
      .filter(d => d.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [ms]);

  // Fundraising ROI
  const fundraisingROI = useMemo(() => {
    const fundraisingDepts = ms.departments.filter(d =>
      d.name.includes('Golf') || d.name.includes('Vision Night') || d.name.includes('Fundraising')
    );
    const frRev = fundraisingDepts.reduce((s, d) =>
      s + d.lineItems.filter(li => li.section === 'revenue' && !li.isTotal).reduce((ss, li) => ss + li.actual, 0), 0);
    const frExp = fundraisingDepts.reduce((s, d) =>
      s + d.lineItems.filter(li => li.section === 'expense' && !li.isTotal).reduce((ss, li) => ss + li.actual, 0), 0);
    return frExp > 0 ? frRev / frExp : 0;
  }, [ms]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-black">Revenue Overview</h2>
        <p className="text-brand-grey mt-1">Deep dive into revenue sources and trends</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(revenue.actual, true)}
          icon={<DollarSign size={18} />}
          color="sky"
          tooltip="Total money received from all sources"
          subtitle={revenue.budget > 0 ? `${formatPercent((revenue.actual / revenue.budget) * 100)} of ${budgetMonths < 12 ? 'YTD ' : ''}budget` : undefined}
        />
        <KPICard
          title="Avg Monthly Revenue"
          value={formatCurrency(avgMonthly, true)}
          icon={<TrendingUp size={18} />}
          color="navy"
          tooltip="Average revenue per month for the selected period"
        />
        <KPICard
          title="Cash vs In-Kind Split"
          value={inKindVsCash.length > 1 ? `${Math.round((inKindVsCash[0].value / revenue.actual) * 100)}% Cash` : '100% Cash'}
          icon={<Coins size={18} />}
          color="amber"
          tooltip="How much revenue is cash vs donated goods/services"
        />
        <KPICard
          title="Fundraising ROI"
          value={fundraisingROI > 0 ? `${fundraisingROI.toFixed(1)}x` : 'N/A'}
          icon={<Target size={18} />}
          color="emerald"
          tooltip="For every $1 spent on fundraising events, how much was raised"
        />
      </div>

      {/* Monthly trend */}
      <ChartCard title="Monthly Revenue Trend" subtitle="Actual vs budget over time">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
            <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
            <Tooltip formatter={tooltipFmt} />
            <Legend />
            <Area type="monotone" dataKey="actual" name="Actual" stroke={COLORS.brandRed} fill={COLORS.brandRed} fillOpacity={0.15} strokeWidth={2} />
            <Area type="monotone" dataKey="budget" name="Budget" stroke={COLORS.brandGrey} fill="none" strokeDasharray="5 5" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Mix */}
        <ChartCard title="Revenue by Category" subtitle="Breakdown of revenue sources">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={revenueMix}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={false}
              >
                {revenueMix.map((_, idx) => (
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

        {/* Cash vs In-Kind */}
        <ChartCard title="Cash vs In-Kind Revenue">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={inKindVsCash}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              >
                <Cell fill={COLORS.brandRed} />
                <Cell fill={COLORS.brandBlue} />
              </Pie>
              <Tooltip formatter={tooltipFmt} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Sources */}
      <ChartCard title="Top Revenue Sources by Department" subtitle="Ranked by total revenue">
        <ResponsiveContainer width="100%" height={Math.max(200, topSources.length * 40)}>
          <BarChart data={topSources} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
            <Tooltip formatter={tooltipFmt} />
            <Bar dataKey="revenue" fill={COLORS.brandRed} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
