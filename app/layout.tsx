import type {Metadata} from 'next';
import { Hind_Siliguri } from 'next/font/google';
import './globals.css'; // Global styles
import Footer from '@/components/Footer';

const hindSiliguri = Hind_Siliguri({
  weight: ['400', '500', '600', '700'],
  subsets: ['bengali'],
  variable: '--font-bengali',
});



export const metadata = {
  title: "DJMC '35 Batch Directory",
  description:
    "The unofficial database for DjMC Batch 35. Find your batchmates, explore districts, and stay connected.",
  verification: {
    google: "NHPo7_4X-8UMBKoFM5txoRK5AWhXAYvPSLxwLBZASuI",
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={`${hindSiliguri.variable} font-sans flex flex-col min-h-screen`} suppressHydrationWarning>
        {children}
        <Footer />
      </body>
    </html>
  );
}
