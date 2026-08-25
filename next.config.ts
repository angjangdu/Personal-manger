import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Dev access from LAN devices (e.g. phone at 192.168.56.1). */
  allowedDevOrigins: ["192.168.56.1"],
};

export default nextConfig;
