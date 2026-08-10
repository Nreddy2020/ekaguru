import Link from 'next/link';
import { ArrowRight, BookOpen, Brain, CircleHelp, Sparkles } from 'lucide-react';

const nextActions = [
    { title: 'Continue a learning session', detail: 'Return to your most recent concept when a session is available.', href: '/student/session', icon: Brain },
    { title: 'Add learning material', detail: 'Bring in a textbook, note or worksheet to make it part of your library.', href: '/library/add', icon: BookOpen },
    { title: 'Explore a concept', detail: 'Use the Learning Room to question, practise and reflect.', href: '/learn/fractions', icon: CircleHelp },
];

export default function LearnPage() {
    return (
        <main className="mx-auto min-h-screen max-w-6xl px-5 py-12 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-200">Learner home</p>
            <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div><h1 className="text-4xl font-black tracking-tight text-white">Learn in the way your mind needs.</h1><p className="mt-3 max-w-2xl text-slate-300">Choose a next step. EKAGURU will gradually connect this space to your materials, knowledge map and learning evidence.</p></div>
                <Link href="/library/add" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 py-3 font-bold text-slate-950 hover:bg-teal-200">Add material <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <section className="mt-10 grid gap-4 md:grid-cols-3">
                {nextActions.map(({ title, detail, href, icon: Icon }) => <Link key={title} href={href} className="group rounded-2xl border border-white/10 bg-[#0c1b30] p-6 transition hover:-translate-y-0.5 hover:border-teal-200/30 hover:bg-[#10243e]"><Icon className="h-6 w-6 text-teal-200" /><h2 className="mt-8 text-lg font-bold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-teal-200">Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>)}
            </section>
            <section className="mt-10 rounded-2xl border border-indigo-300/15 bg-gradient-to-r from-indigo-500/15 to-teal-300/10 p-7"><div className="flex items-start gap-4"><span className="rounded-xl bg-indigo-300/15 p-3"><Sparkles className="h-6 w-6 text-indigo-200" /></span><div><h2 className="font-bold text-white">Growth is more than a score.</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">This page will show concepts that are understood, developing or ready to revisit—alongside the evidence that supports each view.</p></div></div></section>
        </main>
    );
}
