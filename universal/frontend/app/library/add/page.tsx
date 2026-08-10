import Link from 'next/link';
import { ArrowLeft, FileUp, ShieldCheck } from 'lucide-react';

export default function AddMaterialPage() {
    return (
        <main className="mx-auto min-h-screen max-w-3xl px-5 py-12 lg:px-8">
            <Link href="/library" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to library</Link>
            <p className="mt-10 text-sm font-bold uppercase tracking-[0.18em] text-teal-200">Add learning material</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white">Bring a source into your learning library.</h1><p className="mt-3 text-slate-300">Use the existing secure upload flow. The next phase will add material status, source ownership and image/note support.</p>
            <Link href="/upload" className="mt-8 flex items-center justify-between rounded-2xl border border-teal-200/25 bg-teal-200/[0.06] p-6 transition hover:bg-teal-200/10"><span className="flex items-center gap-4"><span className="rounded-xl bg-teal-300 p-3"><FileUp className="h-6 w-6 text-slate-950" /></span><span><span className="block font-bold text-white">Upload a PDF, DOCX or EPUB</span><span className="mt-1 block text-sm text-slate-400">Maximum file size: 50 MB</span></span></span><span className="text-sm font-bold text-teal-200">Open upload</span></Link>
            <p className="mt-6 flex items-center gap-2 text-sm text-slate-400"><ShieldCheck className="h-4 w-4 text-teal-200" /> Your learning materials should remain private and controlled by your account.</p>
        </main>
    );
}
