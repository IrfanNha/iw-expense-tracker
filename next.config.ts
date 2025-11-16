import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["recharts"],
  // Ensure Prisma generated files are included in build
  outputFileTracingIncludes: {
    "/api/**/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
