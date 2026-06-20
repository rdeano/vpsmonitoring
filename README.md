# VPS Dashboard

A personal server management dashboard for Robert's DigitalOcean Ubuntu server (`setoria.site`). Replaces repetitive SSH sessions for common tasks: checking server health, deploying projects, managing services, and viewing logs.

## Stack

- **Backend** — Laravel 13, PHP 8.3
- **Frontend** — React 18 + Inertia.js + MUI v6
- **Build** — Vite
- **Database** — SQLite (local dev) / MySQL 8 (production)
- **Auth** — Single hardcoded admin login via `.env`
- **Server comms** — SSH via phpseclib3

## Features

- **Server Health** — CPU, RAM, disk, uptime with color-coded thresholds. Auto-refreshes every 30s.
- **Deploy** — Trigger `deploy.sh` scripts on the VPS per project. Shows real-time output and deployment history.
- **Services** — Start, stop, restart Nginx / MySQL / PHP-FPM / Queue Worker with confirmation dialogs.
- **Log Viewer** — Tail any registered log file, filter by keyword, auto-refresh toggle.

## Local Development

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install && npm run build
php artisan serve
```

Visit `http://localhost:8000`. Login with the credentials in your `.env`:

```
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your-password
```

> Note: SSH features won't work locally unless you point `.env` at a reachable VPS with a valid key.

## Deploying to VPS

```bash
# On the VPS
git clone <repo> /var/www/vpsmonitoring
cd /var/www/vpsmonitoring

composer install --no-interaction --no-dev --optimize-autoloader --prefer-dist
npm install && npm run build

cp .env.example .env
php artisan key:generate
# Edit .env — set DB, auth credentials, SSH key path

mysql -u root -p -e "CREATE DATABASE vpsmonitoring;"
php artisan migrate --force

chown -R www-data:www-data storage bootstrap/cache
```

## Configuration

### `.env` keys

| Key | Description |
|-----|-------------|
| `DASHBOARD_USERNAME` | Admin login username |
| `DASHBOARD_PASSWORD` | Plain text (local) or bcrypt hash (production) |
| `DASHBOARD_SSH_HOST` | `127.0.0.1` — dashboard runs on the same VPS |
| `DASHBOARD_SSH_PORT` | SSH port (default `22`) |
| `DASHBOARD_SSH_USER` | SSH user (e.g. `ubuntu`) |
| `DASHBOARD_SSH_KEY_PATH` | Path to private key (e.g. `/home/ubuntu/.ssh/id_rsa`) |

Generate a bcrypt hash for production:
```bash
php artisan tinker --execute="echo bcrypt('yourpassword');"
```

### Registering projects

Edit `config/projects.php`:
```php
['name' => 'Setoria Site', 'path' => '/var/www/setoria', 'deploy_sh' => '/var/www/setoria/deploy.sh'],
```

### Registering services

Edit `config/services_dashboard.php`:
```php
['name' => 'Nginx', 'unit' => 'nginx'],
```

### Registering log files

Edit `config/logs.php`:
```php
['name' => 'Nginx Error', 'path' => '/var/log/nginx/error.log'],
```

## Nginx Config

```nginx
server {
    listen 8443 ssl;
    server_name setoria.site;

    root /var/www/vpsmonitoring/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    }
}
```

## Sudo Permissions

Add to `/etc/sudoers.d/dashboard` so `www-data` can control services:

```
www-data ALL=(ALL) NOPASSWD: /bin/systemctl start nginx, /bin/systemctl stop nginx, /bin/systemctl restart nginx
www-data ALL=(ALL) NOPASSWD: /bin/systemctl start mysql, /bin/systemctl stop mysql, /bin/systemctl restart mysql
www-data ALL=(ALL) NOPASSWD: /bin/systemctl start php8.3-fpm, /bin/systemctl stop php8.3-fpm, /bin/systemctl restart php8.3-fpm
www-data ALL=(ALL) NOPASSWD: /bin/bash /var/www/*/deploy.sh
```

## deploy.sh Template

Each registered project needs a `deploy.sh` on the VPS. Use `deploy.example.sh` as a starting point — the key flag is `--no-interaction` on composer to prevent prompts:

```bash
composer install --no-interaction --no-dev --optimize-autoloader --prefer-dist
```
