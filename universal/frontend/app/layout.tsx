import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { TutorProvider } from '@/contexts/TutorContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Jarvis Tutor - AI-Powered Learning',
    description: 'Your personal AI tutor for structured, visual learning',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} bg-gray-900 text-white`}>
                <TutorProvider>
                    <Navbar />
                    {children}
                </TutorProvider>
            </body>
        </html>
    );
}
