import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export type IntegrityStatus = 'VERIFIED' | 'WARNING' | 'FAILED' | 'UNKNOWN';

export interface IntegrityCheck {
  id: string;
  label: string;
  status: IntegrityStatus;
  detail?: string;
}

export interface LearningIntegrityItemProps {
  check: IntegrityCheck;
  className?: string;
}

/**
 * MODULE 04: Individual Integrity Check Item
 * Renders an integrity assertion with accessible status icon and styling.
 */
export function LearningIntegrityItem({
  check,
  className = '',
}: LearningIntegrityItemProps) {
  const getStatusIcon = (status: IntegrityStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <CheckCircle2
            data-testid="integrity-icon-verified"
            aria-label="Status: Verified"
            className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
          />
        );
      case 'WARNING':
        return (
          <AlertTriangle
            data-testid="integrity-icon-warning"
            aria-label="Status: Warning"
            className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
          />
        );
      case 'FAILED':
        return (
          <XCircle
            data-testid="integrity-icon-failed"
            aria-label="Status: Verification Failed"
            className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"
          />
        );
      default:
        return (
          <HelpCircle
            data-testid="integrity-icon-unknown"
            aria-label="Status: Unknown"
            className="w-4 h-4 text-slate-500 shrink-0 mt-0.5"
          />
        );
    }
  };

  const getStatusColor = (status: IntegrityStatus) => {
    switch (status) {
      case 'VERIFIED':
        return 'text-slate-200';
      case 'WARNING':
        return 'text-amber-200';
      case 'FAILED':
        return 'text-rose-200 line-through decoration-rose-500';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <li
      data-testid={`integrity-item-${check.id}`}
      className={`flex items-start gap-2.5 text-xs select-none ${className}`}
    >
      {getStatusIcon(check.status)}
      <div className="min-w-0 flex-1">
        <p className={`font-medium leading-snug ${getStatusColor(check.status)}`}>
          {check.label}
        </p>
        {check.detail && (
          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{check.detail}</p>
        )}
      </div>
    </li>
  );
}
