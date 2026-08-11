import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || (process.env.NODE_ENV === "production" ? "https://back-end-agendazap.mrwoap.easypanel.host" : "http://localhost:3001")}/:path*`,
      },
      {
        source: '/api/media/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || (process.env.NODE_ENV === "production" ? "https://back-end-agendazap.mrwoap.easypanel.host" : "http://localhost:3001")}/api/media/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/agenda',
        destination: '/calendar',
        permanent: true,
      },
    ];
  },
  allowedDevOrigins: ['threaten-removable-unaudited.ngrok-free.dev'],
};

export default nextConfig;
