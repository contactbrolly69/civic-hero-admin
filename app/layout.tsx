import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Civic Hero — Trust & Operations Console', template: '%s · Civic Hero Console' },
  description: 'Internal operations and trust & safety console for Civic Hero.',
  robots: 'noindex, nofollow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">{children}</body>
    </html>
  );
}
