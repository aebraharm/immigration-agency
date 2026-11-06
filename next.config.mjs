/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@libsql/client'],
  outputFileTracingIncludes: {
    '/': ['./db/schema.sql'],
    '/api/**/*': ['./db/schema.sql'],
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, no-cache, max-age=0, must-revalidate' },
          { key: 'CDN-Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Netlify-CDN-Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
