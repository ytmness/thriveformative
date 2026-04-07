const withNextIntl = require('next-intl/plugin')(
  './i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // para despliegue en servidor (Node)
  // R3F v9 + drei 10: suele compilar sin transpilar; si falla el build, volver a añadir three/fiber/drei.
}

module.exports = withNextIntl(nextConfig);
