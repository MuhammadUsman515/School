import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: { serverActions: { allowedOrigins: ['localhost:3000'] } },
  images: { domains: ['localhost', 's3.amazonaws.com', 'cloudfront.net'] },
};

export default nextConfig;
