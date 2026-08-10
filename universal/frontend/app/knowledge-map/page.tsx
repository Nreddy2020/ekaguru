import Link from 'next/link';
import { ArrowRight, CircleDot, GitBranch, Map as MapIcon } from 'lucide-react';

const concepts = [
    { name: 'Parts of a whole', state: 'Ready to explore', position: 'left-0 top-24' },
    { name: 'Equivalent fractions', state: 'Developing', position: 'left-[34%] top-7' },
    { name: 'Adding fractions', state: 'Next step', position: 'right-0 top-28' },
    { name: 'Comparing fractions', state: 'Connected concept', position: 'left-[38%] bottom-2' },
];

export default function KnowledgeMapPage() {
    return (
        <main className="mx-auto min-h-screen max-w-6xl px-5 py-12 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-200">Knowledge Map</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white">See how ideas connect.</h1><p className="mt-3 max-w-2xl text-slate-300">This is the experience shell. When the library and concept graph are connected, it will show the real prerequisites and evidence behind each learning path.</p>
            <section className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1b30] p-6 sm:p-10"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold text-slate-200"><MapIcon className="h-5 w-5 text-teal-200" /> Fractions</span><span className="rounded-full bg-teal-200/10 px-3 py-1 text-xs font-bold text-teal-100">Preview</span></div><div className="relative mt-10 h-80"><div className="absolute left-[18%] top-[42%] h-px w-[64%] -rotate-[16deg] bg-indigo-300/35" /><div className="absolute left-[18%] top-[46%] h-px w-[60%] rotate-[22deg] bg-indigo-300/35" />{concepts.map(({ name, state, position }) => <div key={name} className={`absolute ${position} w-40 rounded-xl border border-white/15 bg-[#132944] p-4 shadow-xl`}><CircleDot className="h-5 w-5 text-teal-200" /><p className="mt-3 text-sm font-bold text-white">{name}</p><p className="mt-1 text-xs text-slate-400">{state}</p></div>)}</div></section>
            <section className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-indigo-300/15 bg-indigo-300/[0.07] p-6 sm:flex-row sm:items-center"><div className="flex gap-3"><GitBranch className="mt-0.5 h-5 w-5 shrink-0 text-indigo-200" /><p className="text-sm leading-6 text-slate-300">The next implementation phase will persist concepts, source evidence and prerequisite relationships from your uploaded materials.</p></div><Link href="/library" className="inline-flex shrink-0 items-center gap-2 font-bold text-teal-200">Open library <ArrowRight className="h-4 w-4" /></Link></section>
        </main>
    );
}
