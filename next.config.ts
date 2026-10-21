import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const chromiumFiles = [
  "./node_modules/.pnpm/@sparticuz+chromium*/node_modules/@sparticuz/chromium/bin/**",
  "./node_modules/@sparticuz/chromium/bin/**",
];

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: Object.fromEntries(
    ["/api/**", "/invoices/**", "/recurring/**", "/i/**"].map((route) => [route, chromiumFiles])
  ),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
