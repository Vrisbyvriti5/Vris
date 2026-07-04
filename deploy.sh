#!/bin/bash
set -e

echo "1. Updating Server"
sudo apt update
sudo apt upgrade -y

echo "2. Installing Node.js 22"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install nodejs -y
node -v
npm -v

echo "3. Installing Git"
sudo apt install git -y
git --version

echo "4. Cloning Backend Repository"
if [ -d "Vris" ]; then
  echo "Repository Vris already exists. Pulling latest..."
  cd Vris
  git pull
  cd ..
else
  git clone https://github.com/Vrisbyvriti5/Vris.git
fi

cd Vris/nirvi-Backend-style

echo "5. Installing Dependencies"
npm install

echo "6. Creating Production Environment File"
cat << 'EOF' > .env
# ─── Server ────────────────────────────────────────
PORT=5000
NODE_ENV=production

# ─── MySQL Database ────────────────────────────────
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_db_password
# DB_NAME=your_database_name

# ─── JWT ───────────────────────────────────────────
JWT_SECRET=faf6659598634776f5777b61e238ecc949aca6977d183b2ae101508305061373ca4659d86aed
JWT_EXPIRES_IN=7d

# ─── CORS ──────────────────────────────────────────
CLIENT_URL=https://vrisbyvriti.com

# ─── Razorpay ──────────────────────────────────────

# ─── Email (Gmail SMTP via Nodemailer) ─────────────
EMAIL_USER=admin@vrisbyvriti.com
EMAIL_PASS=vritikhanna

# ─── Google OAuth ──────────────────────────────────
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-YOUR_GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-YOUR_GOOGLE_CLIENT_SECRET}
SESSION_SECRET=${SESSION_SECRET:-YOUR_SESSION_SECRET}

# ─── Database (Cloud - optional) ──────────────────
DB_HOST=nirvi-database.c1kuqsso2ry8.ap-south-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=j7nfZXVWh6mK3Du
DB_NAME=nirvi_ecommerce

# ─── Image Storage (AWS S3) ───────────────────────
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=vrisbyvriti-assets
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-YOUR_AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-YOUR_AWS_SECRET_ACCESS_KEY}
EOF

echo "7 & 8. Installing PM2 and Starting App"
if ! command -v pm2 &> /dev/null
then
    sudo npm install -g pm2
fi
pm2 start server.js --name vris-backend || pm2 restart vris-backend
pm2 save
# pm2 startup outputs a command to run, but we can generate and run it
env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

echo "9. Installing Nginx"
sudo apt install nginx -y
sudo systemctl start nginx || true
sudo systemctl enable nginx || true

echo "10. Configuring Nginx Reverse Proxy"
cat << 'EOF' | sudo tee /etc/nginx/sites-available/default
server {
    listen 80;

    server_name api.vrisbyvriti.com;

    location / {
        proxy_pass http://localhost:5000;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;

        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo nginx -t
sudo systemctl reload nginx

echo "13. Setting up SSL Certificate"
# To avoid prompts, use --non-interactive and agree to TOS
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx --non-interactive --agree-tos -m admin@vrisbyvriti.com -d api.vrisbyvriti.com --redirect || echo "Certbot failed, probably because DNS hasn't propagated or it was already issued. Check logs."

echo "Deployment Script Completed."
