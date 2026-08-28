import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface LearningBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * MODULE 02: Dynamic Learning Breadcrumbs
 * 
 * Renders hierarchical path: Library > [Material] > [Unit] > [Chapter] > [Topic]
 * Handles deep hierarchies and truncates gracefully on mobile viewports.
 */
export function LearningBreadcrumbs({
  items,
  className = '',
}: LearningBreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      data-testid="learning-breadcrumbs"
      className={`flex items-center gap-1.5 text-xs font-medium text-slate-400 overflow-x-auto no-scrollbar ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isCurrent = item.active ?? isLast;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <ChevronRight
                data-testid="breadcrumb-separator"
                className="w-3.5 h-3.5 text-slate-600 shrink-0 select-none"
              />
            )}
            <div className="flex items-center shrink-0">
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className="hover:text-indigo-300 transition-colors text-slate-400 hover:underline underline-offset-2 truncate max-w-[140px] sm:max-w-[200px]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  data-testid={isCurrent ? 'breadcrumb-current' : undefined}
                  className={`truncate max-w-[160px] sm:max-w-[240px] ${
                    isCurrent
                      ? 'text-white font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10'
                      : 'text-slate-300'
                  }`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
