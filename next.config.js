const path = require('path');
const withNextIntl = require('next-intl/plugin')(
  './i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // para despliegue en servidor (Node)
  /**
   * Evita dos copias de React en el cliente (típico con @react-three/fiber + code splitting),
   * que rompe con: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig').
   */
  webpack: (config, { isServer }) => {
    // Solo cliente: en el servidor Next/next-intl resuelven `react` distinto (p. ej. `cache`).
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      };
    }
    return config;
  },
}

module.exports = withNextIntl(nextConfig);
