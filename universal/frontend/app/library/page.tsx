import Link from 'next/link';
import { ArrowRight, BookMarked, FileText, Image, Plus, Upload } from 'lucide-react';

const materialTypes = [
    { title: 'Textbooks', detail: 'Structured sources for concepts and chapters.', icon: BookMarked },
    { title: 'Notes & worksheets', detail: 'Personal learning context and practice material.', icon: FileText },
    { title: 'Images & pages', detail: 'Photographed pages and visual learning sources.', icon: Image },
];

export default function LibraryPage() {
    return (
        <main className="mx-auto min-h-screen max-w-6xl px-5 py-12 lg:px-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-200">Learning Library</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white">Your material, made learnable.</h1><p className="mt-3 max-w-2xl text-slate-300">Each item will become a connected source for chapters, topics, concepts and prerequisites—not just a file upload.</p></div><Link href="/library/add" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 py-3 font-bold text-slate-950 hover:bg-teal-200"><Plus className="h-4 w-4" /> Add material</Link></div>
            <section className="mt-10 grid gap-4 md:grid-cols-3">{materialTypes.map(({ title, detail, icon: Icon }) => <div key={title} className="rounded-2xl border border-white/10 bg-[#0c1b30] p-6"><Icon className="h-6 w-6 text-indigo-200" /><h2 className="mt-6 text-lg font-bold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p></div>)}</section>
            <section className="mt-8 rounded-2xl border border-dashed border-teal-200/30 bg-teal-200/[0.04] p-8 text-center"><Upload className="mx-auto h-8 w-8 text-teal-200" /><h2 className="mt-4 text-xl font-bold text-white">Start with one learning source</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">The current upload flow supports PDF, DOCX and EPUB. Image, note and assignment ingestion will follow in the next library phase.</p><Link href="/library/add" className="mt-6 inline-flex items-center gap-2 font-bold text-teal-200 hover:text-teal-100">Open upload <ArrowRight className="h-4 w-4" /></Link></section>
        </main>
    );
}
