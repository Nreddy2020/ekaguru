/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server components
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
