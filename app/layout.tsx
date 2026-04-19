import type { Metadata } from 'next';
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
  title: {
    template: '%s | DjMC-35 Portal',
    default: 'DjMC-35 Portal | Dinajpur Medical College', // Fallback
  },
  description: 'The unofficial batch portal and directory for the 35th batch of Dinajpur Medical College.',
  applicationName: 'DjMC-35 Portal', // Added to reinforce site name
  keywords: ['DjMC', 'Dinajpur Medical College', 'Batch 35', 'Medical Students Bangladesh', 'DjMC-35'],
  openGraph: {
    title: 'DjMC-35 Batch Portal',
    description: 'Connect with the 35th batch of Dinajpur Medical College.',
    url: 'https://djmc35.pages.dev',
    siteName: 'DjMC-35 Portal',
    images: [
      {
        url: 'https://djmc35.pages.dev/og-image.png', // Add a nice preview image to your public folder
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  other: { 'google-site-verification': 'P1_TDoHWByQWvuBzG_iSP4PJouqX94d5L9qjmTY2iTU' },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  // Website Schema (JSON-LD) to explicitly define the site name for search engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DjMC-35 Portal",
    "alternateName": ["Dinajpur Medical College Batch 35", "DjMC 35"],
    "url": "https://djmc35.pages.dev/"
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inject Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
