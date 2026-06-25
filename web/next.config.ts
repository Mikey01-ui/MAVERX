import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit loads Helvetica.afm from disk; bundling breaks those paths in production.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
