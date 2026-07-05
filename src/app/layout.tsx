import type { Metadata } from 'next';
import { Orbitron, Inter } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
});

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
});

export const metadata: Metadata = {
  title: 'VELOCITY | Interactive 3D Gameplay Portfolio',
  description: 'Drive through my development journey in this AAA-style interactive 3D gaming portfolio. Experience real-time physics, graphics configurations, and play the WebGL racing demo.',
  keywords: 'Unity, 3D Web, Game Developer Portfolio, WebGL, Next.js, Three.js, React Three Fiber, React 19',
  authors: [{ name: 'Adil N.' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${orbitron.variable} ${inter.variable} min-h-full bg-[#030303] text-[#f5f5f5] antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
