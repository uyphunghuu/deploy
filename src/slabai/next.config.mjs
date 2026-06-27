/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for Docker: creates a self-contained output folder
  output: "standalone",
};

export default nextConfig;
