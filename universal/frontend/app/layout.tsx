import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
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
            <body className={`${inter.className} bg-[#07111f] text-slate-100`}>
                <TutorProvider>
                    <Navbar />
                    {children}
                </TutorProvider>
            </body>
        </html>
    );
}
