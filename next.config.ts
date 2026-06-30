import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Yerel ağdan (telefon vb.) dev sunucusuna erişime izin ver
  allowedDevOrigins: ["172.20.10.14"],
  images: {
    // Telifsiz görseller Unsplash CDN'inden gelir
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
