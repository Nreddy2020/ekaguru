/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  distDir: 'dist',
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
