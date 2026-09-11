import { UniversalKnowledgeUniverseStudio } from '../../../../../../components/learning/UniversalKnowledgeUniverseStudio';

export default function LessonRuntimePage({ params, searchParams }: {
  params: { bookId: string; lessonId: string }; searchParams?: { page?: string };
}) {
  const requested = Number(searchParams?.page || 1);
  return <UniversalKnowledgeUniverseStudio bookId={params.bookId} sectionId={params.lessonId}
    physicalPage={Number.isInteger(requested) && requested > 0 ? requested : 1} />;
}
