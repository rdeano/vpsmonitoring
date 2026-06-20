# VPS Dashboard — CLAUDE.md

## Project Overview

A personal VPS management dashboard for Robert's DigitalOcean Ubuntu server (`setoria.site`).
Built to replace repetitive SSH sessions for common tasks: checking server health, deploying
projects via git pull, restarting services, and viewing logs.

**This is a single-user, personal tool. No multi-tenancy, no user management, no SaaS.**

---

## Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | Laravel 11, PHP 8.3                 |
| Frontend    | React 18 + Inertia.js + MUI v6      |
| Build       | Vite                                |
| Database    | MySQL 8 (minimal use — config only) |
| Auth        | Single hardcoded admin login (no registration) |
| Server comms| SSH via PHP (phpseclib3)            |
| Deployment  | Same VPS it manages (self-hosted)   |

---

## Core Features (V1)

### 1. Server Health Monitor
- Display real-time CPU usage, RAM usage, disk usage, and uptime
- Data fetched via SSH commands (`top`, `df`, `free`, `uptime`)
- Auto-refresh every 30 seconds
- Simple visual indicators: green (healthy), yellow (warning), red (critical)
- Thresholds: CPU >80% = warning, >90% = critical; RAM >75% = warning; Disk >85% = warning

### 2. Git Pull Deployer
- List of registered projects (stored in config file)
- Each project has: name, path on server (e.g. `/var/www/setoria`), and path to its `deploy.sh`
- "Deploy" button triggers the project's existing `deploy.sh` via SSH (`bash /var/www/setoria/deploy.sh`)
- Dashboard does NOT re-implement deployment logic — `deploy.sh` is the source of truth
- Show real-time output of the script in a terminal-style output box
- Deployment history log: timestamp, project, result (success/fail), output snippet

### 3. Service Manager
- List of registered services: Nginx, MySQL, PHP-FPM, Laravel Queue Worker
- Show current status of each (running / stopped)
- Actions: Start, Stop, Restart — executed via SSH (`sudo systemctl {action} {service}`)
- Confirmation dialog before restart/stop to prevent accidental downtime

### 4. Log Viewer
- List of registered log files (Nginx error log, Laravel app log, etc.)
- View last N lines of any log file (default: 100 lines)
- Auto-refresh toggle for live tailing
- Basic search/filter within loaded log content

---

## Out of Scope (V1)

- File manager
- Database GUI / query runner
- Firewall rule management
- SSL certificate management
- Multi-server support
- User accounts / roles

---

## Architecture Notes

### SSH Communication
Use `phpseclib/phpseclib` (v3) for SSH connections from PHP.
All server commands run through a single `SshService` class.
SSH credentials (host, port, user, private key path) stored in `.env`, never in DB.

```
DASHBOARD_SSH_HOST=127.0.0.1
DASHBOARD_SSH_PORT=22
DASHBOARD_SSH_USER=ubuntu
DASHBOARD_SSH_KEY_PATH=/home/ubuntu/.ssh/id_rsa
```

Since the dashboard lives on the same VPS it manages, SSH connects to `127.0.0.1`.

### Authentication
Single admin user. Credentials in `.env`:
```
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your-hashed-password
```

Use Laravel's built-in session auth. No registration route. No password reset via email.
Just a login page that checks against the `.env` values.

### Project Registry
Store registered projects in `config/projects.php` (not DB) for simplicity:

```php
return [
    [
        'name'      => 'Setoria Site',
        'path'      => '/var/www/setoria',
        'deploy_sh' => '/var/www/setoria/deploy.sh',
    ],
    [
        'name'      => 'Eon Connect',
        'path'      => '/var/www/eon',
        'deploy_sh' => '/var/www/eon/deploy.sh',
    ],
];
```

### Service Registry
Store registered services in `config/services_dashboard.php`:

```php
return [
    ['name' => 'Nginx',           'unit' => 'nginx'],
    ['name' => 'MySQL',           'unit' => 'mysql'],
    ['name' => 'PHP-FPM',         'unit' => 'php8.3-fpm'],
    ['name' => 'Queue Worker',    'unit' => 'laravel-queue'],
];
```

### Log Registry
Store log paths in `config/logs.php`:

```php
return [
    ['name' => 'Nginx Error',   'path' => '/var/log/nginx/error.log'],
    ['name' => 'Laravel App',   'path' => '/var/www/setoria/storage/logs/laravel.log'],
];
```

---

## Security Notes

- Dashboard must only be accessible on a non-standard port or behind a firewall rule
- Nginx config should restrict access by IP if possible
- All SSH commands must be whitelisted in `SshService` — no arbitrary command execution
- CSRF protection enabled on all forms/actions
- Session timeout: 30 minutes of inactivity

---

## Database Schema (Minimal)

Only one table needed for V1:

```sql
-- deployment_logs
id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
project_name    VARCHAR(100)
branch          VARCHAR(100)
status          ENUM('success', 'failed')
output          TEXT
deployed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## UI/UX Notes

- Dark theme — this is a developer tool, dark is appropriate
- Single-page feel using Inertia.js — no full page reloads
- MUI v6 components throughout (consistent with Robert's other projects)
- Dashboard home = health monitor overview
- Sidebar navigation: Dashboard, Deploy, Services, Logs
- Mobile responsive but primarily desktop-use

---

## Nginx Config (Dashboard)

Host the dashboard at a subdomain, e.g. `dash.setoria.site` or restrict by port.

```nginx
server {
    listen 8443 ssl;
    server_name setoria.site;

    # ... SSL config ...

    root /var/www/vps-dashboard/public;
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

---

## Sudo Permissions for PHP-FPM User

The `www-data` user (or whoever runs PHP-FPM) needs limited sudo for service management.
Add to `/etc/sudoers.d/dashboard`:

```
www-data ALL=(ALL) NOPASSWD: /bin/systemctl start nginx, /bin/systemctl stop nginx, /bin/systemctl restart nginx
www-data ALL=(ALL) NOPASSWD: /bin/systemctl start mysql, /bin/systemctl stop mysql, /bin/systemctl restart mysql
www-data ALL=(ALL) NOPASSWD: /bin/systemctl start php8.3-fpm, /bin/systemctl stop php8.3-fpm, /bin/systemctl restart php8.3-fpm
www-data ALL=(ALL) NOPASSWD: /bin/bash /var/www/*/deploy.sh
```

---

## Development Notes

- Run locally against the real VPS via SSH (same `.env` config)
- Or mock `SshService` with a `FakeSshService` that returns dummy output for local dev
- Keep all SSH commands in `SshService` as named methods — never construct commands from user input
