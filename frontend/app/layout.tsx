import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hub-IA-Kraken',
  description: 'Modular Cognitive Operating System based on Agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
