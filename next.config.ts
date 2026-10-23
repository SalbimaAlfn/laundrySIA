import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is opt-in for this project: the app is session-based and
  // mostly dynamic, so predictable request-time rendering is preferred.
  cacheComponents: false,
  // The MariaDB driver loads optional native modules at runtime, so keep it
  // outside the server bundle.
  serverExternalPackages: ["mariadb", "@prisma/adapter-mariadb"],
};

export default nextConfig;
