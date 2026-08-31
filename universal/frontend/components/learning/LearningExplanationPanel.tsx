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
  sectionId = 'festivals-of-india',
  sectionTitle = 'Festivals of India',
  conceptName = 'Sankranthi & Harvest Festivals',
  description = '',
  sourceAnchor,
  className = '',
}: LearningExplanationPanelProps) {
  return (
    <UniversalKnowledgeUniverseStudio
      sectionId={sectionId}
      sectionTitle={sectionTitle}
      conceptName={conceptName}
      description={description}
      printedPage={sourceAnchor?.printedPage || 2}
      className={className}
    />
  );
}
