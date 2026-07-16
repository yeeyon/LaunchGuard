/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: { typedRoutes: true },
  poweredByHeader: false,
};

export default nextConfig;
