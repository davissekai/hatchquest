import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // Proxy /api/game/* to the Fastify backend so the browser never makes
  // a cross-origin request — no CORS config needed in dev or production.
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";
    const destination = backendUrl.startsWith("http") ? backendUrl : `https://${backendUrl}`;
    return [
      {
        source: "/api/game/:path*",
        destination: `${destination}/api/game/:path*`,
      },
    ];
  },
};

export default nextConfig;
