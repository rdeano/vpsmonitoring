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
            $id = $this->ssh->startDeploy($deployScript);
            return response()->json(['id' => $id, 'project_name' => $request->project_name]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function status(Request $request, string $id): JsonResponse
    {
        try {
            $result = $this->ssh->getDeployStatus($id);

            if ($result['done']) {
                $projectName = $request->query('project');
                DeploymentLog::create([
                    'project_name' => $projectName ?? 'unknown',
                    'branch'       => 'main',
                    'status'       => $result['success'] ? 'success' : 'failed',
                    'output'       => $result['output'],
                ]);
            }

            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
