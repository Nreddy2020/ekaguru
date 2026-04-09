'use client';

import { Search, Upload, User, Shield, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTutor } from '@/contexts/TutorContext';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { parentMode, setParentMode } = useTutor();
    const isParentPath = pathname.startsWith('/parent');

    return (
        <nav className="flex justify-between items-center p-4 bg-gray-900 text-white border-b border-gray-800">
            <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <h1 className="text-xl font-bold">Jarvis Tutor</h1>
            </Link>

            <div className="flex gap-4 items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        className="pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none w-64"
                        placeholder="Search topics..."
                    />
                </div>

                <Link href="/upload">
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                        <Upload className="w-4 h-4" />
                        Upload Book
                    </button>
                </Link>

                {/* Dynamic Mode Toggle - updates TutorContext.parentMode and navigates */}
                {isParentPath || parentMode ? (
                    <button
                        onClick={() => {
                            setParentMode(false);
                            router.push('/student/session');
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors border border-green-500 shadow-lg"
                    >
                        <GraduationCap className="w-4 h-4" />
                        Student Mode
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            setParentMode(true);
                            router.push('/parent/dashboard');
                        }}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors border border-purple-500 shadow-lg"
                    >
                        <Shield className="w-4 h-4" />
                        Parent Dashboard
                    </button>
                )}

                <button className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow">
                    <User className="w-5 h-5" />
                </button>
            </div>
        </nav>
    );
}
