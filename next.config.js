const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strip moment.js non-English locales from the client bundle. Moment
  // pulls in ~50–80KB of locale data we never use (the dashboard calendar
  // is the only moment consumer and it's English-only). When we migrate
  // off moment to date-fns this plugin becomes unnecessary; until then
  // it's the cheapest bundle win available.
  webpack: (config) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
    );
    return config;
  },
  rewrites: async () => {
    return [
      // Serve OG preview images from a public path that is NOT under /api/.
      // The handlers live at app/api/og/* but robots.txt disallows /api/, and
      // some social crawlers (notably Twitter/X) don't reliably honor an
      // `Allow: /api/og/` override of that broader `Disallow: /api/`. Exposing
      // the same handlers under /og/* sidesteps robots entirely for every
      // crawler — /og/ isn't under any disallowed path. Query strings pass
      // through automatically. The old /api/og/* URLs still work too, so
      // already-cached social cards don't break.
      { source: "/og", destination: "/api/og" },
      { source: "/og/:path*", destination: "/api/og/:path*" },
    ];
  },
  redirects: async () => {
    return [
      {
        source: "/github",
        destination: "https://github.com/afonsocrg/adamastor",
        permanent: true,
      },
      {
        source: "/linkedin",
        destination: "https://linkedin.com/company/adamastor-magazine/",
        permanent: true,
      },
      // Consolidate inbound link equity from the legacy query-param filter
      // URLs onto the new route-segment URLs. Order matters — the most
      // specific match must come first, otherwise /events?city=lisboa&category=design
      // would match the city-only rule and drop the category param.
      {
        source: "/events",
        has: [
          { type: "query", key: "city", value: "(?<city>.+)" },
          { type: "query", key: "category", value: "(?<category>.+)" },
        ],
        destination: "/events/:city/:category",
        permanent: true,
      },
      {
        source: "/events",
        has: [{ type: "query", key: "city", value: "(?<city>.+)" }],
        missing: [{ type: "query", key: "category" }],
        destination: "/events/:city",
        permanent: true,
      },
      {
        source: "/events",
        has: [{ type: "query", key: "category", value: "(?<category>.+)" }],
        missing: [{ type: "query", key: "city" }],
        destination: "/events/:category",
        permanent: true,
      },
    ];
  },
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
