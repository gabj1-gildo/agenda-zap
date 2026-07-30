import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || 'http://localhost:3010'}/:path*`,
      },
    ];
  }
};

export default nextConfig;
