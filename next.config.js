/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingIncludes: {
      '/api/config': ['./tools/config_data/**/*.json'],
    },
  },
}

module.exports = nextConfig
