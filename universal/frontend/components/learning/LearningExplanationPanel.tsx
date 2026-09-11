'use client';

import React from 'react';
import { UniversalKnowledgeUniverseStudio } from './UniversalKnowledgeUniverseStudio';

export interface LearningExplanationPanelProps {
  bookId?: string;
  sectionId?: string;
  sectionTitle?: string;
  conceptName?: string;
  description?: string;
  sourceAnchor?: any;
  className?: string;
}

export function LearningExplanationPanel({
  bookId,
  sectionId = 'festivals-of-india',
  sectionTitle = 'Festivals of India',
  conceptName = 'Sankranthi & Harvest Festivals',
  description = '',
  sourceAnchor,
  className = '',
}: LearningExplanationPanelProps) {
  const sourceBookId = bookId || sourceAnchor?.bookId;
  if (!sourceBookId) return <p role="status">Open a textbook to start page teaching.</p>;
  return (
    <UniversalKnowledgeUniverseStudio
      bookId={sourceBookId}
      physicalPage={sourceAnchor?.physicalPage || sourceAnchor?.pdfPage || 1}
      sectionId={sectionId}
      sectionTitle={sectionTitle}
      conceptName={conceptName}
      description={description}
      printedPage={sourceAnchor?.printedPage || 2}
      className={className}
    />
  );
}
