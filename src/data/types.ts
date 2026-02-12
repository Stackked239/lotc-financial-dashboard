export interface MonthlyEntry {
  month: string; // "Jan", "Feb", etc.
  year: number;
  label: string; // "Jan 2025"
  revenue: { actual: number; budget: number };
  expenses: { actual: number; budget: number };
  netRevenue: { actual: number; budget: number };
  categories: Record<string, CategoryData>;
}

export interface CategoryData {
  name: string;
  actual: number;
  budget: number;
  variance: number;
  percentOfBudget: number;
  children: CategoryData[];
  isTotal: boolean;
  section: 'revenue' | 'expense';
}

export interface DepartmentData {
  name: string;
  actual: number;
  budget: number;
  variance: number;
  percentOfBudget: number;
  lineItems: LineItem[];
}

export interface LineItem {
  name: string;
  actual: number;
  budget: number;
  variance: number;
  percentOfBudget: number;
  depth: number;
  isTotal: boolean;
  section: 'revenue' | 'expense';
  children: LineItem[];
}

export interface MothershipData {
  year: number;
  departments: DepartmentData[];
  totalRevenue: { actual: number; budget: number };
  totalExpenses: { actual: number; budget: number };
  netRevenue: { actual: number; budget: number };
  lineItems: LineItem[];
}

export interface ProgramPerformance {
  name: string;
  revenue: { actual: number; budget: number };
  expenses: { actual: number; budget: number };
  net: number;
  percentOfBudget: number;
  year: number;
}

export interface FinancialData {
  monthly: MonthlyEntry[];
  mothership2025: MothershipData;
  mothership2026: MothershipData;
  programs: ProgramPerformance[];
  isLoading: boolean;
  error: string | null;
}

export type YearFilter = 2025 | 2026 | 'both';
