'use client';

import React from 'react';

interface VitalisCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const VitalisCard: React.FC<VitalisCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#0b1422] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200 ${
        hoverable ? 'hover:border-white/[0.16] hover:bg-[#0e192b] cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const VitalisPanel: React.FC<VitalisCardProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#08111d] border border-white/[0.06] rounded-xl p-3.5 sm:p-4 ${className}`}
    >
      {children}
    </div>
  );
};
