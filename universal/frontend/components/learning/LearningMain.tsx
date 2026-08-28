import React from 'react';

export interface LearningMainProps {
  children?: React.ReactNode;
  className?: string;
}

export function LearningMain({
  children,
  className = '',
}: LearningMainProps) {
  return (
    <div
      data-testid="learning-main"
      className={`w-full max-w-5xl mx-auto flex flex-col gap-6 ${className}`}
    >
      {children}
    </div>
  );
}
