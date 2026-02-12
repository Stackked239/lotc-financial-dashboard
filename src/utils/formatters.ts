export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '' : ''}${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

// Recharts-compatible tooltip formatter
export function tooltipFmt(value: number | string | undefined): string {
  if (value == null) return '$0';
  return formatCurrency(typeof value === 'string' ? parseFloat(value) : value);
}

/**
 * Pro-rate an annual budget to a YTD period.
 * E.g. if ytdMonths=2 (Jan-Feb), returns annualBudget * 2/12.
 * Returns the full budget if ytdMonths is 0 or 12.
 */
export function prorateBudget(annualBudget: number, ytdMonths: number): number {
  if (ytdMonths <= 0 || ytdMonths >= 12) return annualBudget;
  return annualBudget * (ytdMonths / 12);
}

export function parseCSVNumber(val: string): number {
  if (!val || val.trim() === '') return 0;
  const cleaned = val.replace(/[$,%\s"]/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
