import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { FinancialData, YearFilter } from '../data/types';
import { loadAllData } from '../data/loadData';

interface FinancialContextType extends FinancialData {
  yearFilter: YearFilter;
  setYearFilter: (year: YearFilter) => void;
  /** How many months of 2026 have actual data (e.g. 2 for Jan-Feb) */
  ytdMonths2026: number;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FinancialData>({
    monthly: [],
    mothership2025: {
      year: 2025, departments: [],
      totalRevenue: { actual: 0, budget: 0 },
      totalExpenses: { actual: 0, budget: 0 },
      netRevenue: { actual: 0, budget: 0 },
      lineItems: [],
    },
    mothership2026: {
      year: 2026, departments: [],
      totalRevenue: { actual: 0, budget: 0 },
      totalExpenses: { actual: 0, budget: 0 },
      netRevenue: { actual: 0, budget: 0 },
      lineItems: [],
    },
    programs: [],
    isLoading: true,
    error: null,
  });
  const [yearFilter, setYearFilter] = useState<YearFilter>(2025);
  useEffect(() => {
    loadAllData()
      .then(setData)
      .catch(err => setData(prev => ({ ...prev, isLoading: false, error: err.message })));
  }, []);

  // Count how many months of 2026 have completed reporting (revenue > 0).
  // Using revenue avoids counting stray small expenses in future months.
  const ytdMonths2026 = data.monthly.filter(
    m => m.year === 2026 && m.revenue.actual > 0
  ).length;

  return (
    <FinancialContext.Provider value={{ ...data, yearFilter, setYearFilter, ytdMonths2026 }}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const ctx = useContext(FinancialContext);
  if (!ctx) throw new Error('useFinancial must be used within FinancialProvider');
  return ctx;
}
