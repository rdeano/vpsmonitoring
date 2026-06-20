#!/bin/bash
set -e
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd /var/www/vpsmonitoring

git config --global --add safe.directory /var/www/vpsmonitoring

echo "Pulling latest changes..."
git fetch origin main
git reset --hard origin/main

echo "Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

echo "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader --prefer-dist

echo "Running migrations..."
php artisan migrate --force

echo "Installing Node dependencies..."
npm install --legacy-peer-deps

echo "Building frontend assets..."
npm run build

echo "Optimizing..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Fixing permissions..."
chown -R www-data:www-data /var/www/vpsmonitoring
chmod -R 775 /var/www/vpsmonitoring/storage

echo "✅ vpsmonitoring deployed successfully!"
