import { PublicSite } from '@/components/site/public-site';
import { getPublicData } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const data = await getPublicData();
  return <PublicSite data={data} />;
}
