import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@neondatabase/serverless", "@prisma/adapter-neon", "ws"],
  experimental: {
    // The CLI checker loses captured stdout on this Debian host. The compiler
    // API is the documented Next.js fallback; `npm run typecheck` remains a gate.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
