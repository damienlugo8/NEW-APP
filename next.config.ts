import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Progress photos are served from Supabase Storage via short-lived signed
    // URLs. We render them with next/image `unoptimized` (the URLs already
    // expire), but the host must still be allow-listed.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default nextConfig;
