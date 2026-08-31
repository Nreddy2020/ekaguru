'use client';

import React from 'react';
import { UniversalKnowledgeUniverseStudio } from './UniversalKnowledgeUniverseStudio';

export interface LearningExplanationPanelProps {
  sectionId?: string;
  sectionTitle?: string;
  conceptName?: string;
  description?: string;
  sourceAnchor?: any;
  className?: string;
}

export function LearningExplanationPanel({
  className = '',
}: LearningExplanationPanelProps) {
  return (
    <div data-testid="learning-explanation-panel" className="w-full">
      <UniversalKnowledgeUniverseStudio className={className} />
    </div>
  );
}
