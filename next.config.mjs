/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2gb",
    },
  },
  // Disable the built-in body size limit for API routes so the streaming
  // upload proxy (/api/upload) is not capped by Next.js before busboy sees it.
  // Note: on Vercel, infrastructure-level limits apply separately.
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default nextConfig;
