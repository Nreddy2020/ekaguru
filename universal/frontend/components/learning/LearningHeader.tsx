import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  GraduationCap,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
} from 'lucide-react';
import { LearningBreadcrumbs, BreadcrumbItem } from './LearningBreadcrumbs';

export type MaterialProcessingStatus =
  | 'READY'
  | 'PROCESSING'
  | 'FAILED'
  | 'UPLOADED'
  | 'VALIDATING'
  | 'EXTRACTING'
  | 'STRUCTURING';

export interface UserProfileInfo {
  name: string;
  avatarUrl?: string;
  role?: string;
}

export interface LearningHeaderProps {
  brandName?: string;
  brandHref?: string;
  breadcrumbs: BreadcrumbItem[];
  status?: MaterialProcessingStatus;
  learnerMode?: boolean;
  onToggleLearnerMode?: () => void;
  onBack?: () => void;
  backHref?: string;
  userProfile?: UserProfileInfo;
  notificationCount?: number;
  className?: string;
}

/**
 * MODULE 02: EKAGURU Studio Header
 * 
 * Visual Reference: IMAGE 02 from Image Board
 * Features:
 * - Brand Logo & Back Navigation
 * - Dynamic Breadcrumb Navigation (Library > Material > Unit > Chapter > Topic)
 * - Source Verification Badge (READY / PROCESSING / FAILED)
 * - Learner Mode Toggle ("View as Learner")
 * - Notification Center & User Profile Avatar
 * 
 * Zero hardcoded data. All labels, titles, and breadcrumbs are passed via props.
 */
export function LearningHeader({
  brandName = 'EKAGURU',
  brandHref = '/library',
  breadcrumbs,
  status = 'READY',
  learnerMode = true,
  onToggleLearnerMode,
  onBack,
  backHref = '/library',
  userProfile = { name: 'Learner', role: 'Student' },
  notificationCount = 0,
  className = '',
}: LearningHeaderProps) {
  const renderStatusBadge = () => {
    switch (status) {
      case 'READY':
        return (
          <span
            data-testid="header-status-ready"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Source Verified</span>
          </span>
        );
      case 'FAILED':
        return (
          <span
            data-testid="header-status-failed"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/30"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Verification Failed</span>
          </span>
        );
      default:
        return (
          <span
            data-testid="header-status-processing"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 animate-pulse"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span className="hidden sm:inline">Processing Truth</span>
          </span>
        );
    }
  };

  return (
    <div
      data-testid="learning-header"
      className={`h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 bg-[#0c1222] border-b border-slate-800/80 select-none ${className}`}
    >
      {/* Left Section: Brand / Back + Breadcrumb Path */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {/* Back Button */}
        {onBack ? (
          <button
            onClick={onBack}
            data-testid="header-back-button"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition shrink-0"
            title="Go Back"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href={backHref}
            data-testid="header-back-link"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition shrink-0"
            title="Go Back"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        )}

        {/* Brand Identity */}
        <Link
          href={brandHref}
          data-testid="header-brand"
          className="flex items-center gap-2 text-white font-black tracking-wider text-sm sm:text-base shrink-0 group"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 flex items-center justify-center shadow-md shadow-indigo-950/50 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="hidden md:inline bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-200 font-extrabold tracking-tight">
            {brandName}
          </span>
        </Link>

        {/* Vertical Separator */}
        <div className="h-5 w-px bg-slate-800 shrink-0 hidden sm:block" />

        {/* Dynamic Breadcrumbs */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <LearningBreadcrumbs items={breadcrumbs} />
        </div>
      </div>

      {/* Right Section: Status Badge + Learner Mode + Notifications + Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Source Verification Badge */}
        {renderStatusBadge()}

        {/* Learner View Mode Toggle */}
        <button
          onClick={onToggleLearnerMode}
          data-testid="header-learner-mode-toggle"
          className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            learnerMode
              ? 'bg-gradient-to-r from-indigo-950 to-purple-950 text-indigo-200 border-indigo-500/30 hover:border-indigo-400/50 shadow-inner'
              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>View as Learner</span>
        </button>

        {/* Notification Bell */}
        <button
          data-testid="header-notifications"
          className="relative p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span
              data-testid="notification-badge"
              className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-[#0c1222]"
            />
          )}
        </button>

        {/* User Profile Avatar */}
        <div
          data-testid="header-user-avatar"
          className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-800"
        >
          {userProfile.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover ring-2 ring-indigo-950"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center font-bold text-xs shadow-inner ring-1 ring-white/20">
              {userProfile.name.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
