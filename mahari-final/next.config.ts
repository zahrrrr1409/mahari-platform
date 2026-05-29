import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    // Add your Vercel domain here before deploying.
    // 'localhost:3000' for local dev; Vercel domain for production.
    // Example: 'my-app.vercel.app' or 'mahari.yourdomain.com'
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '') ?? '',
      ].filter(Boolean),
    },
  },

  // Arabic/RTL: allow Google Fonts for IBM Plex Sans Arabic
  // (replace with local fonts for production to avoid GDPR/NCA concerns)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  images: {
    domains: [],       // add CDN domains here when media uploads are added
  },

  // Suppress optional WebSocket peer dependency warnings from Supabase realtime
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'utf-8-validate': false,
      bufferutil:       false,
    };
    return config;
  },
};

export default config;
