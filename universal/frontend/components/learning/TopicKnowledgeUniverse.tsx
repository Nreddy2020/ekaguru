'use client';

import React from 'react';
import { UniversalKnowledgeUniverseStudio } from './UniversalKnowledgeUniverseStudio';

export interface TopicKnowledgeUniverseProps {
  topicId?: string;
  className?: string;
}

export function TopicKnowledgeUniverse({
  topicId = 'c-festivals-india',
  className = '',
}: TopicKnowledgeUniverseProps) {
  return (
    <UniversalKnowledgeUniverseStudio
      bookTitle="MY BODY & LIVING WORLD (EVS Class 5)"
      chapterTitle="Festivals of India"
      printedPage={2}
      className={className}
    />
  );
}
