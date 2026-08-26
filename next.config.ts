import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  /* Dev access from LAN devices (e.g. phone at 192.168.56.1). */
  allowedDevOrigins: ["192.168.56.1"],
  images: { unoptimized: true },
  // Phase 31: bundle + rendering optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui", "sonner"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
