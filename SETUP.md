# Dompet Pro - Setup & Deployment Guide

## Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- PM2 (untuk production)
- Telegram Bot Token (dari @BotFather)
- Gemini API Key (dari Google AI Studio)

## Environment Variables

Buat file `.env.local` dengan isi:

```env
GEMINI_API_KEY=your_gemini_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook
VITE_API_BASE_URL=https://yourdomain.com
PORT=8787

# Security - IMPORTANT!
# Password hash untuk login web (SHA256)
# Generate dengan: echo -n "yourpassword" | sha256sum
APP_PASSWORD_HASH=your_sha256_hash_here

# Telegram username yang diizinkan (tanpa @)
TELEGRAM_ALLOWED_USER=zwolf_dev
```

### Cara Generate Password Hash

```bash
# Linux/Mac
echo -n "passwordanda" | sha256sum

# Atau dengan Node.js
node -e "console.log(require('crypto').createHash('sha256').update('passwordanda').digest('hex'))"
```

Contoh:
- Password: `123` -> Hash: `a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3`
- Password: `mySecurePass!` -> Hash: `(generate sendiri)`

## Installation

```bash
# Clone dan masuk direktori
cd dompet-pro

# Install dependencies
npm install

# Buat folder logs
mkdir -p logs
```

## Development Mode

```bash
# Jalankan web dev server (Vite)
npm run dev

# Di terminal terpisah, jalankan Telegram bot server
npm run server

# Atau jalankan keduanya bersamaan (butuh concurrently)
npm install -D concurrently
npm start
```

## Production Deployment

### 1. Build aplikasi

```bash
# Build web frontend
npm run build

# Build server (opsional, bisa pakai tsx langsung)
npm run build:server
```

### 2. Install PM2

```bash
# Install PM2 globally
npm install -g pm2

# Atau dengan sudo jika diperlukan
sudo npm install -g pm2
```

### 3. Jalankan dengan PM2

```bash
# Start semua apps
pm2 start ecosystem.config.cjs

# Atau start individual
pm2 start ecosystem.config.cjs --only dompet-telegram-bot
pm2 start ecosystem.config.cjs --only dompet-web
```

### 4. PM2 Commands

```bash
# Lihat status semua proses
pm2 status

# Lihat logs real-time
pm2 logs

# Lihat logs spesifik app
pm2 logs dompet-telegram-bot

# Restart aplikasi
pm2 restart dompet-telegram-bot
pm2 restart all

# Stop aplikasi
pm2 stop dompet-telegram-bot
pm2 stop all

# Delete dari PM2
pm2 delete dompet-telegram-bot

# Auto-start saat reboot
pm2 startup
pm2 save
```

## Telegram Bot Commands

| Command | Deskripsi |
|---------|-----------|
| `/start`, `/help` | Lihat panduan penggunaan |
| `/otp` | Generate kode OTP untuk login web |
| `/verify [kode]` | Verifikasi kode OTP |
| `/saldo`, `/balance` | Lihat saldo semua akun |
| `/riwayat`, `/list` | Lihat 5 transaksi terakhir |
| `/hapus [id/keyword]` | Hapus transaksi |
| `/edit [id] [catatan]` | Edit catatan transaksi |

### Contoh Input Transaksi (Natural Language)

```
Beli kopi susu 25000 pakai BCA
Makan siang 50rb dari Gopay
Terima gaji 15juta ke BCA
Bayar listrik 200rb dari Mandiri
Transfer 500rb dari BCA ke Gopay
```

## Webhook Setup (untuk Telegram)

### Menggunakan Nginx (Recommended)

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api/telegram/webhook {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### Set Webhook Manual

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook"
```

## Database

Aplikasi menggunakan SQLite dengan file `dompet.db` yang otomatis dibuat di root project.

### Backup Database

```bash
# Backup
cp dompet.db dompet-backup-$(date +%Y%m%d).db

# Restore
cp dompet-backup-YYYYMMDD.db dompet.db
pm2 restart dompet-telegram-bot
```

## Troubleshooting

### Bot tidak merespons
1. Cek webhook sudah terset: 
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```
2. Cek logs: `pm2 logs dompet-telegram-bot`
3. Pastikan port 8787 tidak diblokir firewall

### OTP tidak valid
- OTP berlaku 5 menit
- Pastikan menggunakan kode terbaru dari `/otp`

### Transaksi tidak tersimpan
- Cek file `dompet.db` ada dan writable
- Cek logs untuk error database

## File Structure

```
dompet-pro/
├── services/
│   ├── telegramBotServer.ts  # Telegram bot + API server
│   ├── geminiService.ts      # AI parsing dengan Gemini
│   ├── database.ts           # SQLite operations
│   └── apiClient.ts          # Frontend API client
├── components/               # React components
├── .env.local               # Environment variables
├── ecosystem.config.cjs     # PM2 configuration
├── dompet.db               # SQLite database (auto-created)
└── logs/                   # PM2 log files
```
