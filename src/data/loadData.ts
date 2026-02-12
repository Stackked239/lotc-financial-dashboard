import { parseMonthlyCSV } from './parseMonthly';
import { parseMothershipCSV } from './parseMothership';
import { FinancialData, ProgramPerformance, MothershipData } from './types';

async function fetchCSV(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.text();
}

function buildPrograms(m2025: MothershipData, m2026: MothershipData): ProgramPerformance[] {
  const programNames = new Set<string>();
  const allDepts = [...m2025.departments, ...m2026.departments];

  // Filter to actual children's programs + fundraising events
  const skipNames = ['Administrative', 'Support Services', 'Headquarter Building',
    'Cornerstone Fund', 'NC Expansion'];

  for (const dept of allDepts) {
    if (!skipNames.includes(dept.name)) {
      programNames.add(dept.name);
    }
  }

  const programs: ProgramPerformance[] = [];
  for (const name of programNames) {
    const dept2025 = m2025.departments.find(d => d.name === name);
    const dept2026 = m2026.departments.find(d => d.name === name);

    // Get revenue and expense line items (always store ANNUAL budgets)
    const getRevExp = (dept: typeof dept2025) => {
      if (!dept) return { rev: 0, revBudget: 0, exp: 0, expBudget: 0 };
      let rev = 0, revBudget = 0, exp = 0, expBudget = 0;
      for (const li of dept.lineItems) {
        if (li.section === 'revenue' && !li.isTotal) {
          rev += li.actual;
          revBudget += li.budget;
        } else if (li.section === 'expense' && !li.isTotal) {
          exp += li.actual;
          expBudget += li.budget;
        }
      }
      return { rev, revBudget, exp, expBudget };
    };

    const d25 = getRevExp(dept2025);
    const d26 = getRevExp(dept2026);

    // Use both years
    for (const [year, data] of [[2025, d25], [2026, d26]] as const) {
      if (data.rev !== 0 || data.revBudget !== 0 || data.exp !== 0 || data.expBudget !== 0) {
        const totalBudget = data.revBudget + data.expBudget;
        const totalActual = data.rev + data.exp;
        programs.push({
          name,
          revenue: { actual: data.rev, budget: data.revBudget },
          expenses: { actual: data.exp, budget: data.expBudget },
          net: data.rev - data.exp,
          percentOfBudget: totalBudget !== 0 ? (totalActual / totalBudget) * 100 : 0,
          year,
        });
      }
    }
  }

  return programs.sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadAllData(): Promise<FinancialData> {
  const [monthlyCSV, mothership2025CSV, mothership2026CSV] = await Promise.all([
    fetchCSV('/data/monthly.csv'),
    fetchCSV('/data/mothership2025.csv'),
    fetchCSV('/data/mothership2026.csv'),
  ]);

  const monthly = parseMonthlyCSV(monthlyCSV);
  const mothership2025 = parseMothershipCSV(mothership2025CSV, 2025);
  const mothership2026 = parseMothershipCSV(mothership2026CSV, 2026);

  const programs = buildPrograms(mothership2025, mothership2026);

  return {
    monthly,
    mothership2025,
    mothership2026,
    programs,
    isLoading: false,
    error: null,
  };
}
