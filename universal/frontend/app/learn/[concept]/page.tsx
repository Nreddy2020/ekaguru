import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, MessageCircleQuestion, PencilLine, Sparkles } from 'lucide-react';

interface LearningRoomPageProps {
    params: { concept: string };
}

const formatConcept = (concept: string) => concept.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function LearningRoomPage({ params }: LearningRoomPageProps) {
    const concept = formatConcept(params.concept);

    return (
        <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 lg:px-8">
            <Link href="/learn" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Learner home</Link>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
                <section className="rounded-2xl border border-white/10 bg-[#0c1b30] p-6 sm:p-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-200">Learning Room</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white">{concept}</h1><p className="mt-4 max-w-2xl leading-7 text-slate-300">A learning conversation will appear here. It will explain with sources, ask a useful question, respond to evidence and choose the next learning action.</p><div className="mt-8 rounded-xl border border-teal-200/15 bg-teal-200/[0.05] p-5"><p className="text-sm font-bold text-teal-100">Start with your own thinking</p><p className="mt-2 text-sm leading-6 text-slate-300">What do you already notice, remember or wonder about this concept?</p><div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-slate-500"><span>Type a thought when the learning loop is connected.</span><MessageCircleQuestion className="h-4 w-4 text-teal-200" /></div></div></section>
                <aside className="space-y-4"><div className="rounded-2xl border border-white/10 bg-[#0c1b30] p-6"><BookOpen className="h-6 w-6 text-indigo-200" /><h2 className="mt-5 font-bold text-white">Source evidence</h2><p className="mt-2 text-sm leading-6 text-slate-400">This panel will identify what came from learning material, what is an explanation and what is an inference.</p></div><div className="rounded-2xl border border-white/10 bg-[#0c1b30] p-6"><PencilLine className="h-6 w-6 text-teal-200" /><h2 className="mt-5 font-bold text-white">Practice & reflect</h2><p className="mt-2 text-sm leading-6 text-slate-400">Attempts, reflections and transfer evidence will update the Learner Digital Twin.</p></div></aside>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-indigo-300/15 bg-indigo-300/[0.07] p-5"><span className="flex items-center gap-3 text-sm text-slate-300"><Sparkles className="h-5 w-5 text-indigo-200" /> This route is ready for the adaptive learning loop.</span><Link href="/knowledge-map" className="inline-flex items-center gap-2 text-sm font-bold text-teal-200">View map <ArrowRight className="h-4 w-4" /></Link></div>
        </main>
    );
}
