/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Rewrites proxied API-Calls zum Backend
  async rewrites() {
    // Im Docker-Netzwerk heißt der Container "backend:8000", lokal "localhost:8000"
    const backendUrl =
      process.env.INTERNAL_API_URL ??
      (process.env.NODE_ENV === "production" ? "http://backend:8000" : "http://localhost:8000");

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
    ];
  },

  // Security Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
