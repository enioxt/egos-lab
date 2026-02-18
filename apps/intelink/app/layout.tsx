import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/intelink/Toast';
import { AuthProvider } from '@/providers/AuthProvider';
import { JourneyProvider } from '@/providers/JourneyContext';
import GlobalSearchProvider from '@/components/shared/GlobalSearchProvider';
import { IntelinkFocusProvider } from '@/contexts/IntelinkFocusContext';
import MobileNavBar from '@/components/mobile/MobileNavBar';
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';
import JourneyFABGlobal from '@/components/shared/JourneyFABGlobal';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0ea5e9',
};

export const metadata: Metadata = {
  title: 'INTELINK - Sistema de Inteligência Policial',
  description: 'Plataforma de análise de vínculos e inteligência investigativa',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Intelink',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icons/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <JourneyProvider>
            <IntelinkFocusProvider>
              <ToastProvider>
                <GlobalSearchProvider />
                <div className="pb-16 md:pb-0">
                  {children}
                </div>
                <JourneyFABGlobal />
                <MobileNavBar />
                <ServiceWorkerRegistration />
              </ToastProvider>
            </IntelinkFocusProvider>
          </JourneyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
