/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Disable dev tools in production
    devTools: process.env.NODE_ENV === 'production' ? false : undefined,
  },
};

module.exports = nextConfig;