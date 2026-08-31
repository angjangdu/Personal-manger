declare module "next-pwa" {
  import type { NextConfig } from "next";
  interface PWAOptions {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    buildExcludes?: (string | RegExp)[];
    runtimeCaching?: Array<{
      urlPattern: string | RegExp;
      handler: string;
      options: {
        cacheName: string;
        expiration?: { maxEntries?: number; maxAgeSeconds?: number };
        networkTimeoutSeconds?: number;
      };
    }>;
  }
  export default function withPWA(options?: PWAOptions): (config: NextConfig) => NextConfig;
}