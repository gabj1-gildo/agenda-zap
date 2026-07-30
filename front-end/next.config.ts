import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001'}/:path*`,
      },
      {
        source: '/api/media/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001'}/api/media/:path*`,
      },
    ];
  },
  allowedDevOrigins: ['threaten-removable-unaudited.ngrok-free.dev'],
};

export default nextConfig;
