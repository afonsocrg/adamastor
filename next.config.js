/** @type {import('next').NextConfig} */
const nextConfig = {
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
