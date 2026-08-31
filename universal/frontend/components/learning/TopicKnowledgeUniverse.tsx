'use client';

import React from 'react';
import { UniversalKnowledgeUniverseStudio } from './UniversalKnowledgeUniverseStudio';

export interface TopicKnowledgeUniverseProps {
  topicId?: string;
  className?: string;
}

export function TopicKnowledgeUniverse({
  className = '',
}: TopicKnowledgeUniverseProps) {
  return <UniversalKnowledgeUniverseStudio className={className} />;
}
