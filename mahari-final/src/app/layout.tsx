import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const arabicFont = IBM_Plex_Sans_Arabic({
  weight:   ['400', '500', '600'],
  subsets:  ['arabic', 'latin'],
  display:  'swap',
  variable: '--font-arabic',
});

// Tabler Icons webfont — used throughout components via className="ti ti-*"
// Version pinned to avoid unexpected icon changes
const TABLER_CSS = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.11.0/dist/tabler-icons.min.css';

export const metadata: Metadata = {
  title: {
    template: '%s | مهاري',
    default:  'مهاري — منصة التمكين المهاري',
  },
  description:
    'منصة مهاري لاكتشاف قدرات الأشخاص ذوي الإعاقة وبناء مساراتهم نحو الاستقلالية',
  keywords:  ['التربية الخاصة', 'التمكين', 'القدرات', 'مهاري'],
  authors:   [{ name: 'Mahari Platform' }],
  robots:    'noindex, nofollow',  // private platform
};

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={arabicFont.variable}>
      <head>
        <link rel="stylesheet" href={TABLER_CSS} />
      </head>
      <body className={arabicFont.className}>
        <a href="#main-content" className="skip-nav">
          تخطى إلى المحتوى الرئيسي
        </a>
        {children}
      </body>
    </html>
  );
}
