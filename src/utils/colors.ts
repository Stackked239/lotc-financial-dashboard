// LOTC Brand Colors
export const COLORS = {
  // Brand palette
  brandRed: '#c22035',
  brandRedLight: '#d94a5c',
  brandRedDark: '#9e1a2c',
  brandBlue: '#86b2d3',
  brandBlueLight: '#a8c8e0',
  brandBlueDark: '#6a96b8',
  brandBlack: '#060511',
  brandGrey: '#a7a8a3',
  white: '#ffffff',

  // Functional status colors
  emerald: '#10b981',
  emeraldLight: '#34d399',
  amber: '#f59e0b',
  amberLight: '#fbbf24',
  rose: '#ef4444',
  roseLight: '#f87171',

  // Neutral scale
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
};

// Chart color palette — brand colors first, then supporting
export const CHART_COLORS = [
  '#c22035', // brand red
  '#86b2d3', // brand blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#6a96b8', // brand blue dark
  '#d94a5c', // brand red light
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // purple
  '#84cc16', // lime
];

export function getStatusColor(percentOfBudget: number, isExpense = false): string {
  if (isExpense) {
    if (percentOfBudget <= 90) return COLORS.emerald;
    if (percentOfBudget <= 105) return COLORS.amber;
    return COLORS.rose;
  }
  // Revenue: higher is better
  if (percentOfBudget >= 95) return COLORS.emerald;
  if (percentOfBudget >= 75) return COLORS.amber;
  return COLORS.rose;
}

export function getStatusLabel(percentOfBudget: number, isExpense = false): string {
  if (isExpense) {
    if (percentOfBudget <= 90) return 'On Track';
    if (percentOfBudget <= 105) return 'Watch';
    return 'Over Budget';
  }
  if (percentOfBudget >= 95) return 'On Track';
  if (percentOfBudget >= 75) return 'Watch';
  return 'Behind';
}
