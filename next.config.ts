import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  outputFileTracingIncludes: {
    "/[locale]/engineering": ["./src/content/engineering/**"],
    "/[locale]/engineering/[slug]": ["./src/content/engineering/**"],
    "/[locale]/engineering/[slug]/[skill]": ["./src/content/engineering/**"],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
