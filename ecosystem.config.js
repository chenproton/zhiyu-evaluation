module.exports = {
  apps: [
    {
      name: 'evaluation',
      cwd: './.next/standalone',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
        HOSTNAME: '0.0.0.0',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3005,
        HOSTNAME: '0.0.0.0',
      },
      // 日志配置 - 使用相对路径，避免 /var/log/pm2 权限问题
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 自动重启
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      // 内存限制
      max_memory_restart: '1G',
      // 平滑重启
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
