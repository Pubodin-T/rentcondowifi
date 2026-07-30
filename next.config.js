/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['node-ssh', 'ssh2'],
  },
};

module.exports = nextConfig;
