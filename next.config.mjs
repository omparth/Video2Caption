// next.config.mjs
import path from "path";
import webpack from "webpack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  experimental: {
    optimizePackageImports: ["@radix-ui/react-*"],
  },

  headers: async () => [
    {
      source: "/api/:path*",
      headers: [{ key: "Cache-Control", value: "no-store" }],
    },
  ],

  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  webpack: (config, { isServer }) => {
    // 1) Ignore TypeScript declaration files (.d.ts) from node_modules
    config.module.rules.push({
      test: /\.d\.ts$/i,
      issuer: /\.[jt]sx?$/,
      use: "null-loader",
    });

    // 2) Defensive: ensure .mjs resolution
    config.module.rules.push({
      test: /\.m?js/,
      resolve: { fullySpecified: false },
    });

    // 3) Add an alias to redirect the problematic esbuild declaration into an empty module.
    //    This prevents webpack from reading/parsing node_modules/esbuild/lib/main.d.ts
    //    Adjust the left-hand key if error points to a different path inside esbuild.
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // alias the exact problematic file to our empty module
      "esbuild/lib/main.d.ts": path.resolve(process.cwd(), "empty-module.js"),
      // fallback: alias any direct request to main.d.ts
      "esbuild/lib/main": path.resolve(process.cwd(), "empty-module.js"),
    };

    // 4) Ignore plugin for any .d.ts import as a safety net
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.d\.ts$/i,
      }),
    );

    // 5) Mark esbuild + remotion native deps as externals (client builds)
    const extraExternals = [
      "esbuild",
      "@esbuild/win32-x64",
      "@remotion/bundler",
      "@remotion/renderer",
      "@remotion/bundler/dist/index.js",
    ];

    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      ...extraExternals,
    ];

    return config;
  },
};

export default nextConfig;
