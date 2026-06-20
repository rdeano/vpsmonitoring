#!/bin/bash
set -e

DEPLOY_DIR="/var/www/vpsmonitoring"

echo "=== Starting deployment: $(date) ==="

cd "$DEPLOY_DIR"

echo "--- Pulling latest code ---"
git pull origin main

echo "--- Installing PHP dependencies ---"
composer install --no-interaction --no-dev --optimize-autoloader --prefer-dist

echo "--- Running migrations ---"
php artisan migrate --force

echo "--- Clearing and caching config ---"
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "--- Setting permissions ---"
chown -R www-data:www-data storage bootstrap/cache

echo "=== Deployment complete: $(date) ==="
