/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite consumir o pacote TS @vendy/shared sem build separado.
  transpilePackages: ["@vendy/shared"],
};

export default nextConfig;
