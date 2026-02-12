import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import StatusBadge from './StatusBadge';
import { LineItem } from '../data/types';

interface DataTableProps {
  items: LineItem[];
  section: 'revenue' | 'expense' | 'all';
}

export default function DataTable({ items, section }: DataTableProps) {
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = items;
    if (section !== 'all') {
      result = result.filter(item => item.section === section);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(item => item.name.toLowerCase().includes(lower));
    }
    return result;
  }, [items, section, search]);

  const toggleRow = (name: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div>
      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search line items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-slate-800"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 font-medium text-slate-500">Line Item</th>
              <th className="text-right py-2 px-3 font-medium text-slate-500">Actual</th>
              <th className="text-right py-2 px-3 font-medium text-slate-500">Budget</th>
              <th className="text-right py-2 px-3 font-medium text-slate-500">Variance</th>
              <th className="text-right py-2 px-3 font-medium text-slate-500">% of Budget</th>
              <th className="text-center py-2 px-3 font-medium text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const isTotal = item.isTotal;
              const variance = item.actual - item.budget;
              const pct = item.budget !== 0 ? (item.actual / item.budget) * 100 : 0;
              const isExpense = item.section === 'expense';

              // Color coding for variance cells
              let varianceColor = 'text-slate-600';
              if (item.budget !== 0) {
                if (isExpense) {
                  varianceColor = variance <= 0 ? 'text-emerald-600' : 'text-rose-600';
                } else {
                  varianceColor = variance >= 0 ? 'text-emerald-600' : 'text-rose-600';
                }
              }

              return (
                <tr
                  key={`${item.name}-${idx}`}
                  className={`border-b border-slate-100 hover:bg-slate-50 ${
                    isTotal ? 'bg-slate-50 font-semibold' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-slate-800">
                    <button
                      onClick={() => toggleRow(item.name)}
                      className="flex items-center gap-1"
                    >
                      {item.children?.length > 0 ? (
                        expandedRows.has(item.name) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                      ) : (
                        <span className="w-3.5" />
                      )}
                      <span style={{ paddingLeft: `${item.depth * 16}px` }}>{item.name}</span>
                    </button>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {formatCurrency(item.actual)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {formatCurrency(item.budget)}
                  </td>
                  <td className={`py-2 px-3 text-right ${varianceColor}`}>
                    {formatCurrency(variance)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {item.budget !== 0 ? formatPercent(pct) : '—'}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {item.budget !== 0 && <StatusBadge percent={pct} isExpense={isExpense} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No matching line items found.
        </div>
      )}
    </div>
  );
}
