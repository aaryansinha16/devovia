"use client";

import React from 'react';
import { cn } from '@repo/ui/lib/utils';

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const ClientPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className
}: ClientPaginationProps) => {
  // Calculate the range of pages to show
  const getPageNumbers = () => {
    let pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      // If there are 7 or fewer pages, show all
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Always show the first page
      pages.push(1);
      
      if (currentPage > 3) {
        // Add ellipsis if current page is further from start
        pages.push('ellipsis');
      }
      
      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        // Add ellipsis if current page is further from end
        pages.push('ellipsis');
      }
      
      // Always show the last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;
  
  return (
    <nav className={cn("flex items-center justify-center space-x-1", className)} aria-label="Pagination">
      {/* Previous Page Button */}
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium",
          currentPage === 1
            ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
      >
        <span className="sr-only">Previous page</span>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>
      
      {/* Page Numbers */}
      {getPageNumbers().map((pageNum, idx) => 
        pageNum === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            ...
          </span>
        ) : (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              "relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium",
              currentPage === pageNum
                ? "bg-primary text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            aria-current={currentPage === pageNum ? "page" : undefined}
          >
            {pageNum}
          </button>
        )
      )}
      
      {/* Next Page Button */}
      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(
          "relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium",
          currentPage >= totalPages
            ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        aria-disabled={currentPage >= totalPages}
        tabIndex={currentPage >= totalPages ? -1 : undefined}
      >
        <span className="sr-only">Next page</span>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </nav>
  );
};

export default ClientPagination;
