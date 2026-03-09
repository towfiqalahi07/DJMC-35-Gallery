import type {Metadata} from 'next';
import {Analytics} from '@vercel/analytics/next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: "DJMC '35 Batch Directory",
  description: "The unofficial database for DjMC Batch 35. Find your batchmates, explore districts, and stay connected.",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
