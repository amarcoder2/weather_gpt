/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['three'],
  serverExternalPackages: ['pg', 'bcryptjs'],
};

export default nextConfig;
