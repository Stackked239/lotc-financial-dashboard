import Papa from 'papaparse';
import { MonthlyEntry, CategoryData } from './types';
import { parseCSVNumber } from '../utils/formatters';

interface ColumnInfo {
  month: string;
  year: number;
  metric: 'Actual' | 'Budget' | 'Over Budget' | '% of Budget';
  label: string; // "Jan 2025"
  colIndex: number;
}

function parseHeaders(headerRow: string[]): ColumnInfo[] {
  const columns: ColumnInfo[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 1; i < headerRow.length; i++) {
    const header = headerRow[i]?.trim();
    if (!header) continue;

    // Pattern: "Jan 2025 Actual", "Jan 2025 Budget", "Jan 2025 Over Budget", "Jan 2025 % of Budget"
    // Also: "Total Actual", "Total Budget", etc.
    let matched = false;
    for (const mon of months) {
      for (const year of [2025, 2026]) {
        const prefix = `${mon} ${year}`;
        if (header.startsWith(prefix)) {
          const rest = header.slice(prefix.length).trim();
          let metric: ColumnInfo['metric'] = 'Actual';
          if (rest === 'Actual') metric = 'Actual';
          else if (rest === 'Budget') metric = 'Budget';
          else if (rest === 'Over Budget') metric = 'Over Budget';
          else if (rest === '% of Budget') metric = '% of Budget';
          else continue;

          columns.push({ month: mon, year, metric, label: `${mon} ${year}`, colIndex: i });
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    // Handle "Total" columns
    if (header.startsWith('Total ')) {
      const rest = header.slice(6).trim();
      let metric: ColumnInfo['metric'] = 'Actual';
      if (rest === 'Actual') metric = 'Actual';
      else if (rest === 'Budget') metric = 'Budget';
      else if (rest === 'Over Budget') metric = 'Over Budget';
      else if (rest === '% of Budget') metric = '% of Budget';
      columns.push({ month: 'Total', year: 0, metric, label: 'Total', colIndex: i });
    }
  }
  return columns;
}

export function parseMonthlyCSV(csvText: string): MonthlyEntry[] {
  const result = Papa.parse(csvText, { header: false, skipEmptyLines: false });
  const rows = result.data as string[][];

  // Row 4 (index 3) is the header row
  if (rows.length < 5) return [];
  const headerRow = rows[3];
  const columns = parseHeaders(headerRow);

  // Build a map of month+year -> column indices for Actual and Budget
  const monthMap = new Map<string, { actualIdx: number; budgetIdx: number }>();
  for (const col of columns) {
    if (col.month === 'Total') continue;
    const key = col.label;
    if (!monthMap.has(key)) {
      monthMap.set(key, { actualIdx: -1, budgetIdx: -1 });
    }
    const entry = monthMap.get(key)!;
    if (col.metric === 'Actual') entry.actualIdx = col.colIndex;
    if (col.metric === 'Budget') entry.budgetIdx = col.colIndex;
  }

  // Parse data rows (starting at row 5, index 4)
  const dataRows = rows.slice(4);

  // Find key summary rows
  let totalRevenueRowIdx = -1;
  let totalExpendituresRowIdx = -1;
  let netOperatingRevenueRowIdx = -1;
  let netRevenueRowIdx = -1;
  let inExpenseSection = false;

  // Build category tree
  interface RowData {
    name: string;
    depth: number;
    isTotal: boolean;
    section: 'revenue' | 'expense';
    values: Map<string, { actual: number; budget: number }>;
  }

  const parsedRows: RowData[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    const label = (row[0] || '').replace(/^"(.*)"$/, '$1').trim();
    if (!label) continue;

    if (label === 'Revenue') continue;
    if (label === 'Gross Profit') continue;
    if (label === 'Expenditures') {
      inExpenseSection = true;
      continue;
    }

    if (label === 'Total Revenue') {
      totalRevenueRowIdx = i;
    } else if (label === 'Total Expenditures') {
      totalExpendituresRowIdx = i;
    } else if (label === 'Net Operating Revenue') {
      netOperatingRevenueRowIdx = i;
    } else if (label === 'Net Revenue') {
      netRevenueRowIdx = i;
    }

    // Parse values for each month
    const values = new Map<string, { actual: number; budget: number }>();
    for (const [key, indices] of monthMap.entries()) {
      const actual = indices.actualIdx >= 0 ? parseCSVNumber(row[indices.actualIdx] || '') : 0;
      const budget = indices.budgetIdx >= 0 ? parseCSVNumber(row[indices.budgetIdx] || '') : 0;
      values.set(key, { actual, budget });
    }

    const isTotal = label.startsWith('Total ');
    const depth = label.match(/^\d/) ? 0 : label.startsWith('Total ') ? 0 : 1;

    parsedRows.push({
      name: label,
      depth,
      isTotal,
      section: inExpenseSection ? 'expense' : 'revenue',
      values,
    });
  }

  // Build MonthlyEntry for each month
  const entries: MonthlyEntry[] = [];
  const monthKeys = Array.from(monthMap.keys());

  for (const monthKey of monthKeys) {
    const [mon, yearStr] = monthKey.split(' ');
    const year = parseInt(yearStr);

    // Get total revenue for this month
    const revRow = totalRevenueRowIdx >= 0 ? parsedRows.find(r => r.name === 'Total Revenue') : null;
    const expRow = totalExpendituresRowIdx >= 0 ? parsedRows.find(r => r.name === 'Total Expenditures') : null;
    const netRow = netRevenueRowIdx >= 0 ? parsedRows.find(r => r.name === 'Net Revenue') : null;

    const revVals = revRow?.values.get(monthKey) || { actual: 0, budget: 0 };
    const expVals = expRow?.values.get(monthKey) || { actual: 0, budget: 0 };
    const netVals = netRow?.values.get(monthKey) || { actual: 0, budget: 0 };

    // Build categories for this month
    const categories: Record<string, CategoryData> = {};
    for (const pr of parsedRows) {
      if (pr.name === 'Total Revenue' || pr.name === 'Total Expenditures' ||
          pr.name === 'Net Operating Revenue' || pr.name === 'Net Revenue') continue;

      const vals = pr.values.get(monthKey) || { actual: 0, budget: 0 };
      if (vals.actual === 0 && vals.budget === 0) continue;

      categories[pr.name] = {
        name: pr.name,
        actual: vals.actual,
        budget: vals.budget,
        variance: vals.actual - vals.budget,
        percentOfBudget: vals.budget !== 0 ? (vals.actual / vals.budget) * 100 : 0,
        children: [],
        isTotal: pr.isTotal,
        section: pr.section,
      };
    }

    entries.push({
      month: mon,
      year,
      label: monthKey,
      revenue: { actual: revVals.actual, budget: revVals.budget },
      expenses: { actual: expVals.actual, budget: expVals.budget },
      netRevenue: { actual: netVals.actual, budget: netVals.budget },
      categories,
    });
  }

  return entries;
}
