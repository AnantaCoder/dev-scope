import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Enable standalone output for Docker deployment
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
