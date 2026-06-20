<?php

return [
    'ssh' => [
        'host'     => env('DASHBOARD_SSH_HOST', '127.0.0.1'),
        'port'     => (int) env('DASHBOARD_SSH_PORT', 22),
        'user'     => env('DASHBOARD_SSH_USER', 'root'),
        'key_path' => env('DASHBOARD_SSH_KEY_PATH', '/var/www/.ssh/id_rsa'),
    ],
];
