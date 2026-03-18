import type {Metadata} from 'next';
import { Hind_Siliguri } from 'next/font/google';
import './globals.css'; // Global styles

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
    <html lang="en">
      <body className={`${hindSiliguri.variable} font-sans`} suppressHydrationWarning>{children}</body>
    </html>
  );
}
