<?php

namespace App\Http\Controllers;

use App\Models\DeploymentLog;
use App\Services\SshService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeployController extends Controller
{
    public function __construct(private SshService $ssh) {}

    public function index(): Response
    {
        try {
            $projects = $this->ssh->listProjects();
        } catch (\Throwable $e) {
            $projects = [];
        }

        $history = DeploymentLog::orderByDesc('deployed_at')->limit(20)->get();

        return Inertia::render('Deploy', [
            'projects' => $projects,
            'history'  => $history,
        ]);
    }

    public function deploy(Request $request): JsonResponse
    {
        $request->validate([
            'project_name' => ['required', 'string', 'regex:/^[a-zA-Z0-9_\-]+$/'],
        ]);

        $deployScript = '/var/www/' . $request->project_name . '/deploy.sh';

        try {
            $result = $this->ssh->runDeploy($deployScript);
            $output = $result['output'];
            $status = $result['success'] ? 'success' : 'failed';
        } catch (\Throwable $e) {
            $output = $e->getMessage();
            $status = 'failed';
        }

        DeploymentLog::create([
            'project_name' => $request->project_name,
            'branch'       => 'main',
            'status'       => $status,
            'output'       => $output,
        ]);

        return response()->json(['success' => $status === 'success', 'output' => $output]);
    }
}
