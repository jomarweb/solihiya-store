#!/bin/bash
# Redeploy the latest code: run on the droplet as root.
set -eux
cd /opt/solihiya && git pull --ff-only && npm ci --no-audit --no-fund && npm run build
rm -rf /var/www/solihiya/* && cp -r dist/. /var/www/solihiya/
