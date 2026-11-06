import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource/dm-serif-display/400.css';
import './globals.css';
import { getPublicData } from '@/lib/store';

// Metadata and every page below this layout must read the current CMS record.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getPublicData();
  return {
    title: content.seo.title,
    description: content.seo.description,
    applicationName: content.brand.legalName,
    icons: { icon: '/icon.svg' },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
