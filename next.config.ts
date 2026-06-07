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

  // Legacy notary routes were retired in the FORGE pivot. Anyone hitting an
  // old bookmark lands on the daily hub instead of a 404.
  async redirects() {
    return [
      { source: "/appointments", destination: "/daily", permanent: true },
      { source: "/journal", destination: "/daily", permanent: true },
      { source: "/pipeline", destination: "/daily", permanent: true },
    ];
  },
};

export default nextConfig;
