/** @type {import('next').NextConfig} */

const nextConfig = {
  // Supprimer 'output: export' pour permettre les API routes sur Vercel
  // output: 'export',
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
    unoptimized: true
  },
  experimental: {
    optimizeCss: true,
  },
  compress: true,
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

module.exports = nextConfig;
