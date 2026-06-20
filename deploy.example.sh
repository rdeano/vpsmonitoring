#!/bin/bash
# Example deploy.sh for managed projects.
# Copy this to /var/www/<project>/deploy.sh on the VPS.
set -e

PROJECT_DIR="/var/www/setoria"

echo "=== Deploying: $(date) ==="
cd "$PROJECT_DIR"

echo "--- Git pull ---"
git pull origin main

echo "--- Composer install ---"
# --no-interaction prevents prompts (e.g. "Remove VCS history? [Y,n]")
composer install --no-interaction --no-dev --optimize-autoloader --prefer-dist

echo "--- Migrate ---"
php artisan migrate --force

echo "--- Cache ---"
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "--- Restart queue ---"
php artisan queue:restart

echo "=== Done: $(date) ==="
