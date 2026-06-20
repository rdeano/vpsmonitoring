<?php

namespace App\Services;

use phpseclib3\Net\SSH2;
use phpseclib3\Crypt\PublicKeyLoader;
use RuntimeException;

class SshService
{
    private ?SSH2 $connection = null;

    private function connect(): SSH2
    {
        if ($this->connection && $this->connection->isConnected()) {
            return $this->connection;
        }

        $host    = config('app.ssh_host', env('DASHBOARD_SSH_HOST', '127.0.0.1'));
        $port    = (int) env('DASHBOARD_SSH_PORT', 22);
        $user    = env('DASHBOARD_SSH_USER', 'ubuntu');
        $keyPath = env('DASHBOARD_SSH_KEY_PATH', '/home/ubuntu/.ssh/id_rsa');

        $ssh = new SSH2($host, $port);

        if (file_exists($keyPath)) {
            $key = PublicKeyLoader::load(file_get_contents($keyPath));
            if (!$ssh->login($user, $key)) {
                throw new RuntimeException('SSH key authentication failed.');
            }
        } else {
            throw new RuntimeException("SSH key not found at: {$keyPath}");
        }

        $this->connection = $ssh;
        return $ssh;
    }

    public function getHealth(): array
    {
        $ssh = $this->connect();

        $cpu    = trim($ssh->exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2+$4}'"));
        $mem    = trim($ssh->exec("free | awk '/Mem/{printf \"%.1f\", $3/$2*100}'"));
        $disk   = trim($ssh->exec("df / | awk 'NR==2{print $5}' | tr -d '%'"));
        $uptime = trim($ssh->exec('uptime -p'));

        return [
            'cpu'    => (float) $cpu,
            'memory' => (float) $mem,
            'disk'   => (float) $disk,
            'uptime' => $uptime,
        ];
    }

    public function listProjects(): array
    {
        $ssh = $this->connect();
        $raw = $ssh->exec(
            'for d in /var/www/*/; do ' .
            '[ -d "${d}.git" ] && [ -f "${d}deploy.sh" ] && ' .
            'printf "%s|%s|%s|%s\n" ' .
            '"$(basename "$d")" ' .
            '"$(echo "$d" | sed "s|/$||")" ' .
            '"$(git -C "$d" rev-parse --abbrev-ref HEAD 2>/dev/null)" ' .
            '"$(git -C "$d" log -1 --format="%h %s" 2>/dev/null)"; ' .
            'done'
        );

        $projects = [];
        foreach (explode("\n", trim($raw)) as $line) {
            if (!$line) continue;
            [$name, $path, $branch, $commit] = array_pad(explode('|', $line, 4), 4, '');
            $projects[] = [
                'name'      => $name,
                'path'      => $path,
                'deploy_sh' => $path . '/deploy.sh',
                'branch'    => $branch ?: 'unknown',
                'commit'    => $commit ?: 'No commits yet',
            ];
        }

        return $projects;
    }

    public function runDeploy(string $deployScript): array
    {
        $allowedPattern = '/^\/var\/www\/[a-zA-Z0-9_\-]+\/deploy\.sh$/';
        if (!preg_match($allowedPattern, $deployScript)) {
            throw new RuntimeException('Deploy script path not allowed.');
        }

        $ssh    = $this->connect();
        $output = $ssh->exec("bash " . escapeshellarg($deployScript) . " 2>&1");
        $exit   = $ssh->getExitStatus();

        return ['output' => $output, 'success' => $exit === 0];
    }

    public function getServiceStatus(string $unit): string
    {
        $this->assertAllowedUnit($unit);
        $ssh = $this->connect();
        $out = trim($ssh->exec("systemctl is-active " . escapeshellarg($unit)));
        return $out === 'active' ? 'running' : 'stopped';
    }

    public function controlService(string $action, string $unit): string
    {
        $allowedActions = ['start', 'stop', 'restart'];
        if (!in_array($action, $allowedActions, true)) {
            throw new RuntimeException("Action '{$action}' is not allowed.");
        }
        $this->assertAllowedUnit($unit);

        $ssh = $this->connect();
        return trim($ssh->exec("sudo systemctl {$action} " . escapeshellarg($unit) . " 2>&1"));
    }

    public function readLog(string $path, int $lines = 100): string
    {
        $allowedPaths = collect(config('logs'))->pluck('path')->all();
        if (!in_array($path, $allowedPaths, true)) {
            throw new RuntimeException('Log path not allowed.');
        }

        $ssh = $this->connect();
        return $ssh->exec("tail -n " . (int) $lines . " " . escapeshellarg($path) . " 2>&1");
    }

    private function assertAllowedUnit(string $unit): void
    {
        $allowedUnits = collect(config('services_dashboard'))->pluck('unit')->all();
        if (!in_array($unit, $allowedUnits, true)) {
            throw new RuntimeException("Service unit '{$unit}' is not allowed.");
        }
    }
}
