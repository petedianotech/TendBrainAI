import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tend Brain AI - AI Social Media Autopilot',
  description: 'AI-powered social media autopilot that scans global trends and automatically writes daily posts.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-900 text-slate-100 antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
