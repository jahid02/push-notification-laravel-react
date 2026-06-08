import React from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const DataTable = ({
  headers,
  data = [],
  loading = false,
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
  actions,
}) => {
  
  // Calculate display range: "Showing X to Y of Z entries"
  const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate pagination page numbers
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className="bg-bg-glass border border-border-color rounded-2xl p-6 shadow-md relative overflow-hidden">
      {/* Table Toolbar */}
      {(onSearchChange || actions) && (
        <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange ? (
            <div className="relative max-w-xs w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all duration-150 focus:border-accent-primary focus:bg-white/[0.05] focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          ) : (
            <div className="flex-1"></div>
          )}
          
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}

      {/* Main Table Grid */}
      <div className="w-full overflow-x-auto rounded-xl border border-border-color bg-bg-glass">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-white/[0.01]">
              {headers.map((header) => (
                <th 
                  key={header.key} 
                  className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider"
                  style={{ 
                    width: header.width || 'auto',
                    textAlign: header.align || 'left' 
                  }}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading Skeleton State
              Array.from({ length: itemsPerPage }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="border-b border-border-color last:border-b-0">
                  {headers.map((header) => (
                    <td key={`skeleton-cell-${header.key}`} className="p-4 align-middle">
                      <div 
                        className="h-4 rounded-sm bg-white/5 relative overflow-hidden" 
                        style={{ 
                          width: header.skeletonWidth || '60%', 
                        }}
                      >
                        {/* Shimmer animation */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_1.5s_infinite_linear]"></div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={headers.length} className="text-center p-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox size={40} className="text-text-muted" />
                    <p className="text-text-secondary font-semibold">No records found</p>
                    <p className="text-text-muted text-xs">
                      Try adjusting your search criteria or add new entries.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Real Data State
              data.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex}
                  className="border-b border-border-color last:border-b-0 hover:bg-white/[0.02] transition-colors duration-150"
                >
                  {headers.map((header) => {
                    const value = row[header.key];
                    return (
                      <td 
                        key={header.key} 
                        className="p-4 align-middle text-sm text-text-primary"
                        style={{ textAlign: header.align || 'left' }}
                      >
                        {header.render ? header.render(value, row, rowIndex) : value ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white/[0.01] border-t border-border-color text-sm text-text-secondary mt-2">
          <div>
            Showing <span className="font-semibold text-text-primary">{startEntry}</span> to{' '}
            <span className="font-semibold text-text-primary">{endEntry}</span> of{' '}
            <span className="font-semibold text-text-primary">{totalItems}</span> entries
          </div>
          
          <div className="flex items-center gap-1">
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-border-color text-text-secondary cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-primary hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border text-text-secondary cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-primary hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed ${
                  page === currentPage ? 'bg-accent-primary text-white border-accent-primary hover:bg-accent-primary hover:text-white' : 'border-border-color'
                }`}
                disabled={page === '...'}
                onClick={() => typeof page === 'number' && onPageChange(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-border-color text-text-secondary cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-primary hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
