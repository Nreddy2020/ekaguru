'use client';

import React from 'react';

interface VitalisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClass?: string;
}

export const VitalisDrawer: React.FC<VitalisDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  widthClass = 'max-w-xl',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Slide-over Container */}
      <div
        className={`relative z-10 w-full ${widthClass} bg-[#0b1422] border-l border-white/[0.1] shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200`}
      >
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-white/[0.08] bg-[#08111d] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-[#F4F7FA] tracking-wide flex items-center gap-2">
              {title}
            </h3>
            {subtitle && (
              <span className="text-xs text-slate-400 font-mono block mt-0.5">{subtitle}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};
