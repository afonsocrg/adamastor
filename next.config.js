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
    ];
  },
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
