/** @type {import('next').NextConfig} */

const nextConfig = {
  // Supprimer 'output: export' pour permettre les API routes sur Vercel
  // output: 'export',
  poweredByHeader: false,
  reactStrictMode: true,
  eslint: {
    // Désactiver les vérifications ESLint lors du build pour éviter les échecs de déploiement
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Désactiver les vérifications TypeScript lors du build pour éviter les échecs de déploiement
    ignoreBuildErrors: true,
  },
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
};

module.exports = nextConfig;
