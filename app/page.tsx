import { headers } from 'next/headers';
import { PublicSite } from '@/components/site/public-site';
import { AccessDenied } from '@/components/security/access-denied';
import { getClientIp } from '@/lib/ip';
import { getPublicData, isIpBlocked, recordVisit } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function HomePage() {
  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const path = requestHeaders.get('x-visitor-path') || '/';
  const userAgent = requestHeaders.get('user-agent') || '';
  const referrer = requestHeaders.get('referer') || '';

  if (ip) {
    try {
      if (await isIpBlocked(ip)) {
        // The edge firewall answers first in production; this server check keeps
        // the restriction enforced even if middleware is bypassed or unavailable.
        await recordVisit({ ip, path, userAgent, referrer, kind: 'blocked' }).catch(() => undefined);
        return <AccessDenied />;
      }
      await recordVisit({ ip, path, userAgent, referrer });
    } catch (error) {
      // Visitor analytics and firewall lookups must never break the public site.
      console.error('Visitor tracking failed', error);
    }
  }

  const data = await getPublicData();
  return <PublicSite data={data} />;
}
