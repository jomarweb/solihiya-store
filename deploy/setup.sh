#!/bin/bash
# First-boot setup for a fresh Ubuntu 24.04 droplet. Log: /var/log/solihiya-setup.log
exec > /var/log/solihiya-setup.log 2>&1
set -eux
export DEBIAN_FRONTEND=noninteractive
if [ ! -f /swapfile ]; then fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab; fi
apt-get update
apt-get install -y nginx ca-certificates curl git ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
rm -rf /opt/solihiya && git clone --depth 1 https://github.com/jomarweb/solihiya-store /opt/solihiya
cd /opt/solihiya
npm ci --no-audit --no-fund
npm run build
mkdir -p /var/www/solihiya && rm -rf /var/www/solihiya/* && cp -r dist/. /var/www/solihiya/
cat > /etc/nginx/sites-available/solihiya <<'NGINX'
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name _;
  root /var/www/solihiya;
  index index.html;
  gzip on;
  gzip_types text/css application/javascript image/svg+xml application/json;
  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; try_files $uri =404; }
  location / { try_files $uri $uri/ /index.html; add_header Cache-Control "no-cache"; }
}
NGINX
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/solihiya /etc/nginx/sites-enabled/solihiya
nginx -t && systemctl reload nginx
ufw allow OpenSSH && ufw allow 'Nginx HTTP' && ufw --force enable
echo SOLIHIYA_SETUP_DONE
