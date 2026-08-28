import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { LearningIntegrityItem, IntegrityCheck, IntegrityStatus } from './LearningIntegrityItem';

export interface LearningContentIntegrityProps {
  checks: IntegrityCheck[];
  overallStatus?: IntegrityStatus;
  title?: string;
  className?: string;
}

/**
 * Deterministically computes overall status from individual check assertions
 * Precedence: FAILED > WARNING > UNKNOWN > VERIFIED
 */
export function computeOverallIntegrity(checks: IntegrityCheck[]): IntegrityStatus {
  if (!checks || checks.length === 0) return 'UNKNOWN';
  if (checks.some((c) => c.status === 'FAILED')) return 'FAILED';
  if (checks.some((c) => c.status === 'WARNING')) return 'WARNING';
  if (checks.some((c) => c.status === 'UNKNOWN')) return 'UNKNOWN';
  return 'VERIFIED';
}

/**
 * MODULE 04: Content Integrity Card
 * 
 * Visual Reference: IMAGE 04 (Lower Left Navigation Rail)
 * Features:
 * - Real-time Source Truth assertions (original text, images, page numbers, zero deviation)
 * - Deterministic overall status computation with zero synthetic fallback
 * - Compact, accessible styling that fits cleanly into the Left Rail footer slot
 * 
 * Zero hardcoded data. Completely driven by the checks array.
 */
export function LearningContentIntegrity({
  checks,
  overallStatus,
  title = 'Content Integrity',
  className = '',
}: LearningContentIntegrityProps) {
  const effectiveStatus = overallStatus ?? computeOverallIntegrity(checks);

  const getHeaderShield = () => {
    switch (effectiveStatus) {
      case 'VERIFIED':
        return <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'FAILED':
        return <ShieldX className="w-4 h-4 text-rose-400 shrink-0" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />;
    }
  };

  const getStatusBadge = () => {
    switch (effectiveStatus) {
      case 'VERIFIED':
        return (
          <span
            data-testid="overall-badge-verified"
            className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30"
          >
            100% Truth
          </span>
        );
      case 'FAILED':
        return (
          <span
            data-testid="overall-badge-failed"
            className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30"
          >
            Failed
          </span>
        );
      default:
        return (
          <span
            data-testid="overall-badge-warning"
            className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30"
          >
            Check Needed
          </span>
        );
    }
  };

  return (
    <div
      data-testid="learning-content-integrity"
      className={`rounded-2xl bg-gradient-to-b from-[#0e1628] to-[#0a101f] border border-slate-800/80 p-4 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          {getHeaderShield()}
          <h4 className="text-xs font-bold text-slate-200 tracking-wide">{title}</h4>
        </div>
        {getStatusBadge()}
      </div>

      {/* Assertions List */}
      <ul
        data-testid="integrity-checks-list"
        aria-label="Content Integrity Checks"
        className="space-y-2.5"
      >
        {checks.map((check) => (
          <LearningIntegrityItem key={check.id} check={check} />
        ))}
      </ul>
    </div>
  );
}
