const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = dotenv.config({ path: envPath }).parsed || {};

module.exports = {
  apps: [
    {
      name: 'dompet-telegram-bot',
      script: 'node_modules/.bin/tsx',
      args: '--env-file=.env.local services/telegramBotServer.ts',
      cwd: '/home/robby/dompet-pro',
      env: {
        NODE_ENV: 'production',
        PORT: 8787,
        START_TELEGRAM_SERVER: 'true',
        ...envConfig
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/telegram-error.log',
      out_file: './logs/telegram-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'dompet-web',
      script: 'node_modules/.bin/vite',
      args: 'preview --port 3000 --host',
      cwd: '/home/robby/dompet-pro',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
