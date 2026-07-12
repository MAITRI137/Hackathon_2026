/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // @react-pdf/renderer must run from node_modules, not the webpack bundle
  serverExternalPackages: ["@react-pdf/renderer"],
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
};

export default nextConfig;
