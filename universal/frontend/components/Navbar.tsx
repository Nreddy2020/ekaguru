'use client';

import { BookOpen, Compass, Library, Map, Sparkles, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
    { href: '/learn', label: 'Learn', icon: Compass },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/knowledge-map', label: 'Knowledge Map', icon: Map },
    { href: '/growth', label: 'My Growth', icon: Sparkles },
];

export default function Navbar() {
    const pathname = usePathname();

    if (
        pathname === '/home' || pathname.startsWith('/home/') ||
        pathname === '/library' || pathname.startsWith('/library/')
    ) {
        return null;
    }

    return (
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
                <Link href="/" className="flex items-center gap-2.5" aria-label="EKAGURU home">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-300 to-indigo-500 shadow-lg shadow-teal-400/10">
                        <BookOpen className="h-5 w-5 text-slate-950" />
                    </span>
                    <span className="text-base font-extrabold tracking-[0.16em] text-white">EKAGURU</span>
                </Link>

                <div className="hidden items-center gap-1 md:flex">
                    {links.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || pathname.startsWith(`${href}/`);
                        return (
                            <Link key={href} href={href} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/parent/dashboard" className="hidden rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white sm:block">For parents</Link>
                    <Link href="/learn" className="flex items-center gap-2 rounded-lg bg-teal-300 px-3 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-teal-200">
                        <UserRound className="h-4 w-4" />
                        <span className="hidden sm:inline">Start learning</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
