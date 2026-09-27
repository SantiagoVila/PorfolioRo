import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy, for now only reported (Content-Security-Policy-Report-Only):
 * the browser logs what it would block, nothing is blocked. Everything the site
 * loads is its own (next/font serves the fonts, next/image the images; the film
 * and the PDFs are local), so 'self' covers it, plus:
 * - script 'unsafe-inline': Next's inline bootstrap scripts (nonces would need
 *   dynamic rendering of this static page);
 * - style 'unsafe-inline': the style attributes framer-motion and next/image set;
 * - img data:: the paper-grain textures drawn as inline SVG.
 * 'unsafe-eval' is for development only (React's dev tooling), never production.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Never shown inside another site's frame (while the CSP's frame-ancestors is only reported).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  // The project root, stated: a package-lock.json in a parent folder would
  // otherwise make Turbopack infer a different workspace root (and warn).
  turbopack: { root: path.join(__dirname) },
  // Development only: let devices on the local network (a phone opening
  // http://<this PC's LAN IP>:3000) use the dev server's own resources. Next
  // blocks them for any hostname but localhost by default, and without the HMR
  // connection the page never hydrates (the loader stays at 0%). No effect on
  // production builds.
  allowedDevOrigins: ["192.168.*.*"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
