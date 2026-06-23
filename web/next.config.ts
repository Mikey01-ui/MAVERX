import type { NextConfig } from "next";

const homelabTunnel = process.env.HOMELAB_TUNNEL_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!homelabTunnel) return [];
    return [
      {
        source: "/:path*",
        destination: `${homelabTunnel}/:path*`,
      },
    ];
  },
};

export default nextConfig;
