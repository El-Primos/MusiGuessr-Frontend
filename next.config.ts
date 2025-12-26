import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'musiguessr-music-bucket.s3.eu-central-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
