import Link from 'next/link';
import { ArrowRight, Brain, Clock3, HeartHandshake, Target } from 'lucide-react';

const signals = [
    { title: 'Understanding', value: 'Emerging', note: 'Evidence will be linked to concept attempts.', icon: Brain },
    { title: 'Confidence', value: 'Worth noticing', note: 'Reflections and learning choices will shape this view.', icon: HeartHandshake },
    { title: 'Retention', value: 'Not measured yet', note: 'Review scheduling comes with the Memory phase.', icon: Clock3 },
];

export default function GrowthPage() {
    return (
        <main className="mx-auto min-h-screen max-w-6xl px-5 py-12 lg:px-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-200">My Growth</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white">Growth should feel understandable.</h1><p className="mt-3 max-w-2xl text-slate-300">EKAGURU will make the evidence visible without permanently labelling a learner by a score or a difficult day.</p><section className="mt-10 grid gap-4 md:grid-cols-3">{signals.map(({ title, value, note, icon: Icon }) => <div key={title} className="rounded-2xl border border-white/10 bg-[#0c1b30] p-6"><Icon className="h-6 w-6 text-teal-200" /><p className="mt-8 text-sm text-slate-400">{title}</p><h2 className="mt-1 text-xl font-bold text-white">{value}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{note}</p></div>)}</section><section className="mt-8 rounded-2xl border border-teal-200/15 bg-teal-200/[0.05] p-7"><Target className="h-6 w-6 text-teal-200" /><h2 className="mt-5 text-xl font-bold text-white">Your next useful action</h2><p className="mt-2 text-sm text-slate-300">Add a learning source or open a Learning Room. The Digital Twin phase will use evidence from those actions to personalise the next recommendation.</p><Link href="/learn" className="mt-5 inline-flex items-center gap-2 font-bold text-teal-200">Go to learner home <ArrowRight className="h-4 w-4" /></Link></section></main>
    );
}
