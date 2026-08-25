module.exports = {
  apps: [
    {
      name: 'appydoer',
      script: 'node',
      args: 'node_modules/next/dist/bin/next start -p 3001',
      cwd: 'D:\\project\\Ai Workbuddy',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
}
