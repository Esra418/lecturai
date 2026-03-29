import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Webpack ile derlemede Lightning CSS yerine PostCSS (postcss-preset-env) kullanılır.
   * Not: Tailwind v4 @tailwindcss/postcss kendi başına lightningcss yükler; bu yüzden
   * projede Tailwind v3 + klasik postcss yapılandırması kullanılıyor (globals.css).
   */
  experimental: {
    useLightningcss: false,
  },
};

export default nextConfig;
