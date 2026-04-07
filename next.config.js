const withNextIntl = require('next-intl/plugin')(
  './i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // para despliegue en servidor (Node)
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
}

module.exports = withNextIntl(nextConfig);
