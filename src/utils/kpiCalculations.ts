import { MonthlyEntry, MothershipData, YearFilter } from '../data/types';

/** Returns all months for the year filter */
export function getFilteredMonthly(monthly: MonthlyEntry[], yearFilter: YearFilter): MonthlyEntry[] {
  if (yearFilter === 'both') return monthly;
  return monthly.filter(m => m.year === yearFilter);
}

/** Returns only months that have completed reporting (revenue > 0).
 *  This avoids counting stray small expenses in future months (e.g. $235 in March). */
function getActiveMonths(monthly: MonthlyEntry[], yearFilter: YearFilter): MonthlyEntry[] {
  const filtered = getFilteredMonthly(monthly, yearFilter);
  return filtered.filter(m => m.revenue.actual > 0);
}

/**
 * Sums revenue actuals and budgets, but only for months with actual data.
 * This prevents comparing 2 months of actuals against 12 months of budget.
 */
export function getTotalRevenue(monthly: MonthlyEntry[], yearFilter: YearFilter): { actual: number; budget: number } {
  const active = getActiveMonths(monthly, yearFilter);
  return active.reduce(
    (acc, m) => ({ actual: acc.actual + m.revenue.actual, budget: acc.budget + m.revenue.budget }),
    { actual: 0, budget: 0 }
  );
}

export function getTotalExpenses(monthly: MonthlyEntry[], yearFilter: YearFilter): { actual: number; budget: number } {
  const active = getActiveMonths(monthly, yearFilter);
  return active.reduce(
    (acc, m) => ({ actual: acc.actual + m.expenses.actual, budget: acc.budget + m.expenses.budget }),
    { actual: 0, budget: 0 }
  );
}

export function getNetSurplus(monthly: MonthlyEntry[], yearFilter: YearFilter): number {
  const rev = getTotalRevenue(monthly, yearFilter);
  const exp = getTotalExpenses(monthly, yearFilter);
  return rev.actual - exp.actual;
}

export function getOperatingMargin(monthly: MonthlyEntry[], yearFilter: YearFilter): number {
  const rev = getTotalRevenue(monthly, yearFilter);
  const exp = getTotalExpenses(monthly, yearFilter);
  if (rev.actual === 0) return 0;
  return ((rev.actual - exp.actual) / rev.actual) * 100;
}

export function getExpenseRatio(monthly: MonthlyEntry[], yearFilter: YearFilter): number {
  const rev = getTotalRevenue(monthly, yearFilter);
  const exp = getTotalExpenses(monthly, yearFilter);
  if (rev.actual === 0) return 0;
  return (exp.actual / rev.actual) * 100;
}

export function getBudgetHealth(monthly: MonthlyEntry[], yearFilter: YearFilter): number {
  const rev = getTotalRevenue(monthly, yearFilter);
  if (rev.budget === 0) return 100;
  const variance = Math.abs(((rev.actual - rev.budget) / rev.budget) * 100);
  return Math.max(0, Math.min(100, 100 - variance));
}

export function getYoYGrowth(monthly: MonthlyEntry[]): number {
  const rev2025 = getTotalRevenue(monthly, 2025);
  const rev2026 = getTotalRevenue(monthly, 2026);
  const months2026WithData = getActiveMonths(monthly, 2026).length;
  if (months2026WithData === 0 || rev2025.actual === 0) return 0;
  const annualized2026 = (rev2026.actual / months2026WithData) * 12;
  return ((annualized2026 - rev2025.actual) / rev2025.actual) * 100;
}

export function getAnnualizedProjection(monthly: MonthlyEntry[]): number {
  const rev2026 = getTotalRevenue(monthly, 2026);
  const months2026WithData = getActiveMonths(monthly, 2026).length;
  if (months2026WithData === 0) return 0;
  return (rev2026.actual / months2026WithData) * 12;
}

export function getPersonnelRatio(mothership: MothershipData): number {
  const personnel = mothership.lineItems.find(li => li.name === 'Total 600 Personnel Expenses');
  if (!personnel || mothership.totalExpenses.actual === 0) return 0;
  return (personnel.actual / mothership.totalExpenses.actual) * 100;
}

export function getProgramSpendRatio(mothership: MothershipData): number {
  const programDepts = mothership.departments.filter(d =>
    !['Administrative', 'Support Services', 'Headquarter Building', 'Cornerstone Fund', 'NC Expansion'].includes(d.name)
  );
  const programExpenses = programDepts.reduce((sum, d) => {
    const expItems = d.lineItems.filter(li => li.section === 'expense' && !li.isTotal);
    return sum + expItems.reduce((s, li) => s + li.actual, 0);
  }, 0);
  if (mothership.totalExpenses.actual === 0) return 0;
  return (programExpenses / mothership.totalExpenses.actual) * 100;
}

export function getAdminOverhead(mothership: MothershipData): number {
  const admin = mothership.departments.find(d => d.name === 'Administrative');
  if (!admin || mothership.totalExpenses.actual === 0) return 0;
  const adminExp = admin.lineItems
    .filter(li => li.section === 'expense' && !li.isTotal)
    .reduce((sum, li) => sum + li.actual, 0);
  return (adminExp / mothership.totalExpenses.actual) * 100;
}

export function getCategoryBreakdown(monthly: MonthlyEntry[], yearFilter: YearFilter, section: 'revenue' | 'expense'): { name: string; value: number }[] {
  const filtered = getFilteredMonthly(monthly, yearFilter);
  const categoryTotals = new Map<string, number>();

  for (const m of filtered) {
    for (const [name, cat] of Object.entries(m.categories)) {
      if (cat.section !== section) continue;
      if (!cat.isTotal) continue;
      const cleanName = name.replace(/^Total /, '');
      categoryTotals.set(cleanName, (categoryTotals.get(cleanName) || 0) + cat.actual);
    }
  }

  return Array.from(categoryTotals.entries())
    .map(([name, value]) => ({ name, value }))
    .filter(c => c.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}
