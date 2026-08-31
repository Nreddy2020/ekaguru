'use client';

import { UniversalKnowledgeUniverseStudio } from '../../../../../../components/learning/UniversalKnowledgeUniverseStudio';

export default function LessonRuntimePage({
  params,
}: {
  params: { bookId: string; lessonId: string };
}) {
  return (
    <UniversalKnowledgeUniverseStudio
      bookId={params.bookId}
      sectionId={params.lessonId}
    />
  );
}
