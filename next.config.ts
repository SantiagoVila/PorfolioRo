import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The project root, stated: a stray package-lock.json in the user's home
  // folder otherwise makes Turbopack guess (and warn on every build).
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
