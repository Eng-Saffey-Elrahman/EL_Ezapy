import React, { useState } from 'react';
import { Search, Inbox } from 'lucide-react';

export const DataTable = ({
  columns = [],
  data = [],
  searchPlaceholder = 'بحث...',
  searchField = null,
  emptyMessage = 'لا توجد بيانات متاحة حالياً',
  loading = false,
  extraFilter = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    if (searchField) {
      const val = row[searchField];
      return String(val || '').toLowerCase().includes(term);
    }

    // Default: search all string / number fields
    return Object.values(row).some((val) =>
      String(val || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="filter-bar">
        <div className="input-group" style={{ flex: 1, minWidth: '240px' }}>
          <span className="input-icon-right">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="form-control input-with-icon-right"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {extraFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {extraFilter}
          </div>
        )}
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={{ textAlign: col.align || 'right', width: col.width || 'auto' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', width: '28px', height: '28px' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>جاري تحميل البيانات...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Inbox size={32} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-secondary)' }}>
                      {emptyMessage}
                    </div>
                    {searchTerm && (
                      <div style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>
                        لا توجد نتائج مطابقة لبحثك: "{searchTerm}"
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, rIdx) => (
                <tr key={rIdx} className={row.rowClassName || ''}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ textAlign: col.align || 'right' }}>
                      {col.render ? col.render(row, rIdx) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
