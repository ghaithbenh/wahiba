import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Disabled - incompatible with Clerk authentication (requires SSR)
  trailingSlash: true, 
  images: {
    unoptimized: true ,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3100',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://127.0.0.1:4000/api/:path*' },
      { source: '/uploads/:path*', destination: 'http://127.0.0.1:4000/uploads/:path*' },
      { source: '/dresses/:path*', destination: 'http://127.0.0.1:4000/dresses/:path*' },
      { source: '/schedules/:path*', destination: 'http://127.0.0.1:4000/schedules/:path*' },
      { source: '/contacts/:path*', destination: 'http://127.0.0.1:4000/contacts/:path*' },
      { source: '/revenues/:path*', destination: 'http://127.0.0.1:4000/revenues/:path*' },
      { source: '/banners/:path*', destination: 'http://127.0.0.1:4000/banners/:path*' },
      { source: '/about-us-images/:path*', destination: 'http://127.0.0.1:4000/about-us-images/:path*' },
    ];
  },
};

export default nextConfig;
