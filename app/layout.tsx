import type {Metadata} from 'next';
import { Hind_Siliguri } from 'next/font/google';
import './globals.css'; // Global styles
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const hindSiliguri = Hind_Siliguri({
  weight: ['400', '500', '600', '700'],
  subsets: ['bengali'],
  variable: '--font-bengali',
});

export const metadata: Metadata = {
  title: "DJMC '35 Batch Directory",
  description: "The unofficial database for DjMC Batch 35. Find your batchmates, explore districts, and stay connected.",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${hindSiliguri.variable} font-sans min-h-screen flex flex-col bg-black text-zinc-300`} suppressHydrationWarning>
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
