import { UniversalKnowledgeUniverseStudio } from '../../../components/learning/UniversalKnowledgeUniverseStudio';

export default function LibraryMaterialPage({ params, searchParams }: {
  params: { id: string }; searchParams?: { page?: string; design?: string };
}) {
  const requested = Number(searchParams?.page || 1);
  const physicalPage = Number.isInteger(requested) && requested > 0 ? requested : 1;
  const Studio = UniversalKnowledgeUniverseStudio;
  return <div className="w-screen h-screen bg-slate-950">
    <Studio bookId={params.id} physicalPage={physicalPage} className="h-full" />
  </div>;
}
