import Link from 'next/link';
import { ArrowRight, BrainCircuit, Compass, Library, Lightbulb, Sparkles } from 'lucide-react';

const journey = [
    { title: 'Understand', description: 'Build strong foundations, not quick answers.', icon: Lightbulb },
    { title: 'Question', description: 'Turn curiosity into deeper thinking.', icon: Compass },
    { title: 'Explore', description: 'Connect ideas across your own learning materials.', icon: Library },
    { title: 'Grow independently', description: 'See evidence of what is becoming easier.', icon: Sparkles },
];

export default function HomePage() {
    return (
        <main className="overflow-hidden">
            <section className="relative isolate px-5 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
                <div className="absolute inset-x-0 top-[-16rem] -z-10 mx-auto h-[38rem] max-w-5xl rounded-full bg-indigo-600/25 blur-3xl" />
                <div className="absolute right-[-8rem] top-16 -z-10 h-80 w-80 rounded-full bg-teal-300/10 blur-3xl" />
                <div className="mx-auto max-w-5xl text-center">
                    <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-200/10 px-4 py-2 text-sm font-medium text-teal-100"><BrainCircuit className="h-4 w-4" /> Universal Learning Intelligence</p>
                    <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Every mind can become more <span className="bg-gradient-to-r from-teal-200 to-indigo-300 bg-clip-text text-transparent">independent.</span></h1>
                    <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-300">EKAGURU helps learners understand, question, explore, practise and create—using the material and evidence that matter to them.</p>
                    <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link href="/learn" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-300 px-5 py-3.5 font-bold text-slate-950 transition hover:bg-teal-200">Start learning <ArrowRight className="h-4 w-4" /></Link>
                        <Link href="/library" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 font-bold text-white transition hover:bg-white/10">Explore your library</Link>
                    </div>
                </div>
            </section>

            <section className="border-y border-white/10 bg-white/[0.03] px-5 py-16 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-teal-200">A better learning loop</p>
                    <div className="mt-9 grid gap-4 md:grid-cols-4">
                        {journey.map(({ title, description, icon: Icon }, index) => (
                            <div key={title} className="rounded-2xl border border-white/10 bg-[#0c1b30] p-6">
                                <span className="text-sm font-bold text-teal-200">0{index + 1}</span>
                                <Icon className="mt-5 h-6 w-6 text-indigo-300" />
                                <h2 className="mt-5 text-lg font-bold text-white">{title}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
