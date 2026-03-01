/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-markdown'],
  },

  // Webpack configuration for importing markdown files and performance
  webpack: (config, { dev, isServer }) => {
    // Markdown loader
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    })

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
            },
            // Markdown-related libraries
            markdown: {
              name: 'markdown',
              test: /[\\/]node_modules[\\/](react-markdown|remark|rehype|highlight\.js)[\\/]/,
              chunks: 'all',
              priority: 10,
            },
            // UI libraries
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              chunks: 'all',
              priority: 9,
            },
          },
        },
      }
    }

    return config
  },
}

module.exports = nextConfig
