import Papa from 'papaparse';
import { MothershipData, DepartmentData, LineItem } from './types';
import { parseCSVNumber } from '../utils/formatters';

interface DeptColumn {
  name: string;
  actualIdx: number;
  budgetIdx: number;
  overBudgetIdx: number;
  pctBudgetIdx: number;
}

function parseDeptHeaders(headerRow: string[]): DeptColumn[] {
  const depts: DeptColumn[] = [];
  // Headers come in groups of 4: Name Actual, Name Budget, Name Over Budget, Name % of Budget
  // We need to extract unique department names

  const deptMap = new Map<string, DeptColumn>();

  for (let i = 1; i < headerRow.length; i++) {
    let header = (headerRow[i] || '').trim();
    if (!header) continue;

    // Replace HTML entities
    header = header.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

    // Extract department name and metric type
    let deptName = '';
    let metric = '';

    if (header.endsWith('% of Budget')) {
      deptName = header.slice(0, -12).trim();
      metric = '% of Budget';
    } else if (header.endsWith('Over Budget')) {
      deptName = header.slice(0, -12).trim();
      metric = 'Over Budget';
    } else if (header.endsWith('Budget')) {
      deptName = header.slice(0, -7).trim();
      metric = 'Budget';
    } else if (header.endsWith('Actual')) {
      deptName = header.slice(0, -7).trim();
      metric = 'Actual';
    }

    if (!deptName || !metric) continue;

    if (!deptMap.has(deptName)) {
      deptMap.set(deptName, {
        name: deptName,
        actualIdx: -1,
        budgetIdx: -1,
        overBudgetIdx: -1,
        pctBudgetIdx: -1,
      });
    }

    const dept = deptMap.get(deptName)!;
    if (metric === 'Actual') dept.actualIdx = i;
    else if (metric === 'Budget') dept.budgetIdx = i;
    else if (metric === 'Over Budget') dept.overBudgetIdx = i;
    else if (metric === '% of Budget') dept.pctBudgetIdx = i;
  }

  return Array.from(deptMap.values());
}

export function parseMothershipCSV(csvText: string, year: number): MothershipData {
  const result = Papa.parse(csvText, { header: false, skipEmptyLines: false });
  const rows = result.data as string[][];

  if (rows.length < 5) {
    return {
      year,
      departments: [],
      totalRevenue: { actual: 0, budget: 0 },
      totalExpenses: { actual: 0, budget: 0 },
      netRevenue: { actual: 0, budget: 0 },
      lineItems: [],
    };
  }

  const headerRow = rows[3];
  const deptColumns = parseDeptHeaders(headerRow);

  // Find the "Total" department (last one)
  const totalDept = deptColumns.find(d => d.name === 'Total');

  // Parse all data rows
  const dataRows = rows.slice(4);
  let inExpenseSection = false;

  const lineItems: LineItem[] = [];
  const departments: DepartmentData[] = [];

  // Initialize departments (skip Total, and skip parent groups like "Childrens Programs <", "Fundraising <")
  const programDepts = deptColumns.filter(d =>
    d.name !== 'Total' &&
    !d.name.startsWith('Total ') &&
    !d.name.startsWith('Childrens Programs') &&
    !d.name.startsWith('Fundraising <') &&
    d.name !== 'Fundraising'
  );

  let totalRevActual = 0, totalRevBudget = 0;
  let totalExpActual = 0, totalExpBudget = 0;
  let netRevActual = 0, netRevBudget = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    const label = (row[0] || '').replace(/^"(.*)"$/, '$1').trim();
    if (!label) continue;

    if (label === 'Revenue') continue;
    if (label === 'Gross Profit') continue;
    if (label === 'Expenditures' || label === 'Other Expenditures') {
      inExpenseSection = true;
      continue;
    }

    // Get total column values
    const totalActual = totalDept ? parseCSVNumber(row[totalDept.actualIdx] || '') : 0;
    const totalBudget = totalDept ? parseCSVNumber(row[totalDept.budgetIdx] || '') : 0;

    if (label === 'Total Revenue') {
      totalRevActual = totalActual;
      totalRevBudget = totalBudget;
      continue;
    }
    if (label === 'Total Expenditures') {
      totalExpActual = totalActual;
      totalExpBudget = totalBudget;
      continue;
    }
    if (label === 'Net Operating Revenue' || label === 'Net Revenue') {
      netRevActual = totalActual;
      netRevBudget = totalBudget;
      continue;
    }
    if (label === 'Total Other Expenditures' || label === 'Net Other Revenue') continue;

    const isTotal = label.startsWith('Total ');
    const depth = isTotal ? 0 : label.match(/^\d/) ? 1 : 2;

    lineItems.push({
      name: label,
      actual: totalActual,
      budget: totalBudget,
      variance: totalActual - totalBudget,
      percentOfBudget: totalBudget !== 0 ? (totalActual / totalBudget) * 100 : 0,
      depth,
      isTotal,
      section: inExpenseSection ? 'expense' : 'revenue',
      children: [],
    });
  }

  // Build department-level summaries
  for (const dept of programDepts) {
    let deptRevActual = 0, deptRevBudget = 0;
    let deptExpActual = 0, deptExpBudget = 0;
    const deptLineItems: LineItem[] = [];
    let inExp = false;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || row.length === 0) continue;

      const label = (row[0] || '').replace(/^"(.*)"$/, '$1').trim();
      if (!label) continue;

      if (label === 'Expenditures' || label === 'Other Expenditures') {
        inExp = true;
        continue;
      }
      if (label === 'Revenue' || label === 'Gross Profit') continue;

      const actual = parseCSVNumber(row[dept.actualIdx] || '');
      const budget = parseCSVNumber(row[dept.budgetIdx] || '');

      if (label === 'Total Revenue') {
        deptRevActual = actual;
        deptRevBudget = budget;
        continue;
      }
      if (label === 'Total Expenditures') {
        deptExpActual = actual;
        deptExpBudget = budget;
        continue;
      }
      if (label === 'Net Operating Revenue' || label === 'Net Revenue' ||
          label === 'Total Other Expenditures' || label === 'Net Other Revenue') continue;

      if (actual !== 0 || budget !== 0) {
        deptLineItems.push({
          name: label,
          actual,
          budget,
          variance: actual - budget,
          percentOfBudget: budget !== 0 ? (actual / budget) * 100 : 0,
          depth: 0,
          isTotal: label.startsWith('Total '),
          section: inExp ? 'expense' : 'revenue',
          children: [],
        });
      }
    }

    const totalActual = deptRevActual + deptExpActual;
    const totalBudget = deptRevBudget + deptExpBudget;

    departments.push({
      name: dept.name,
      actual: totalActual,
      budget: totalBudget,
      variance: totalActual - totalBudget,
      percentOfBudget: totalBudget !== 0 ? (totalActual / totalBudget) * 100 : 0,
      lineItems: deptLineItems,
    });
  }

  return {
    year,
    departments,
    totalRevenue: { actual: totalRevActual, budget: totalRevBudget },
    totalExpenses: { actual: totalExpActual, budget: totalExpBudget },
    netRevenue: { actual: netRevActual, budget: netRevBudget },
    lineItems,
  };
}
