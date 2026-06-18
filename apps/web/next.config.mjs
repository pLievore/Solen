/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite consumir o pacote TS @solen/shared sem build separado.
  transpilePackages: ["@solen/shared"],
};

export default nextConfig;
