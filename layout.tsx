
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClassOrbit | Coaching Marketplace',
  description: 'Discover coaching centres, compare courses and book your seat.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
