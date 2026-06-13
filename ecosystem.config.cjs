/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: "thriveformative",
      cwd: "/var/www/thriveformative/.next/standalone",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
