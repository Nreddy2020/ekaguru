import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TutorProvider } from '@/contexts/TutorContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'EKAGURU — Universal Learning Intelligence',
    description: 'Learning experiences that help people understand, explore, practise and grow independently.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} bg-[#070b14] text-slate-100`}>
                <TutorProvider>
                    {children}
                </TutorProvider>
            </body>
        </html>
    );
}
