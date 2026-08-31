'use client';

import { UniversalKnowledgeUniverseStudio } from '../../../../../../components/learning/UniversalKnowledgeUniverseStudio';

export default function LessonRuntimePage({
  params,
}: {
  params: { bookId: string; lessonId: string };
}) {
  return (
    <UniversalKnowledgeUniverseStudio
      sectionId={params.lessonId}
      sectionTitle="Festivals of India"
      conceptName="Sankranthi & Harvest Festivals"
      printedPage={2}
    />
  );
}
