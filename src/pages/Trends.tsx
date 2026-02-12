import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, LineChart, Line
} from 'recharts';
import { useFinancial } from '../context/FinancialContext';
import ChartCard from '../components/ChartCard';
import { formatCurrency, tooltipFmt } from '../utils/formatters';
import { COLORS, CHART_COLORS } from '../utils/colors';
import { getFilteredMonthly } from '../utils/kpiCalculations';

export default function Trends() {
  const { monthly, yearFilter } = useFinancial();
  const filtered = useMemo(() => getFilteredMonthly(monthly, yearFilter), [monthly, yearFilter]);

  // Cash inflow vs outflow
  const cashFlowData = useMemo(() =>
    filtered.map(m => ({
      name: m.label,
      inflow: m.revenue.actual,
      outflow: m.expenses.actual,
    })), [filtered]);

  // Cumulative surplus/deficit
  const cumulativeData = useMemo(() => {
    let running = 0;
    return filtered.map(m => {
      running += m.revenue.actual - m.expenses.actual;
      return { name: m.label, cumulative: running };
    });
  }, [filtered]);

  // Seasonal overlay: 2025 vs 2026 monthly pattern
  const seasonalData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(mon => {
      const m2025 = monthly.find(m => m.month === mon && m.year === 2025);
      const m2026 = monthly.find(m => m.month === mon && m.year === 2026);
      return {
        name: mon,
        'FY 2025': m2025?.revenue.actual || 0,
        'FY 2026': m2026?.revenue.actual || 0,
      };
    });
  }, [monthly]);

  // Revenue by source trend (stacked area from monthly categories)
  const revBySourceData = useMemo(() => {
    const allCats = new Map<string, number>();
    for (const m of filtered) {
      for (const [name, cat] of Object.entries(m.categories)) {
        if (cat.section === 'revenue' && cat.isTotal) {
          const cleanName = name.replace(/^Total /, '');
          allCats.set(cleanName, (allCats.get(cleanName) || 0) + Math.abs(cat.actual));
        }
      }
    }
    const topCats = Array.from(allCats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    return filtered.map(m => {
      const point: Record<string, string | number> = { name: m.label };
      for (const catName of topCats) {
        const cat = Object.entries(m.categories).find(
          ([name, c]) => c.section === 'revenue' && c.isTotal && name.replace(/^Total /, '') === catName
        );
        point[catName] = cat ? Math.max(0, cat[1].actual) : 0;
      }
      return point;
    });
  }, [filtered]);

  const topCatNames = useMemo(() => {
    if (revBySourceData.length === 0) return [];
    return Object.keys(revBySourceData[0]).filter(k => k !== 'name');
  }, [revBySourceData]);

  // Net monthly bar chart
  const netMonthlyData = useMemo(() =>
    filtered.map(m => ({
      name: m.label,
      net: m.revenue.actual - m.expenses.actual,
    })), [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-black">Cash Flow & Trends</h2>
        <p className="text-brand-grey mt-1">Financial patterns and projections</p>
      </div>

      {/* Cash Flow */}
      <ChartCard title="Monthly Cash Inflow vs Outflow" subtitle="Revenue received vs expenses paid each month">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
            <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
            <Tooltip formatter={tooltipFmt} />
            <Legend />
            <Bar dataKey="inflow" name="Revenue" fill={COLORS.brandBlue} radius={[4, 4, 0, 0]} />
            <Bar dataKey="outflow" name="Expenses" fill={COLORS.brandRed} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative surplus */}
        <ChartCard title="Cumulative Surplus / Deficit" subtitle="Running total of revenue minus expenses">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={tooltipFmt} />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={COLORS.emerald}
                fill={COLORS.emerald}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Net monthly */}
        <ChartCard title="Monthly Net Position" subtitle="Surplus or deficit each month">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={netMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={tooltipFmt} />
              <Bar
                dataKey="net"
                radius={[4, 4, 0, 0]}
                fill={COLORS.brandBlue}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Seasonal comparison */}
      <ChartCard title="Seasonal Revenue Pattern" subtitle="FY 2025 actual vs FY 2026 actual by month">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={seasonalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
            <Tooltip formatter={tooltipFmt} />
            <Legend />
            <Line type="monotone" dataKey="FY 2025" stroke={COLORS.brandBlack} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="FY 2026" stroke={COLORS.brandRed} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Revenue by source stacked */}
      {topCatNames.length > 0 && (
        <ChartCard title="Revenue by Source Trend" subtitle="Top revenue categories over time">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revBySourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={tooltipFmt} />
              <Legend />
              {topCatNames.map((cat, idx) => (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stackId="1"
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
