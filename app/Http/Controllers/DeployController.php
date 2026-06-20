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
        $projects = config('projects');
        $history  = DeploymentLog::orderByDesc('deployed_at')->limit(20)->get();

        return Inertia::render('Deploy', [
            'projects' => $projects,
            'history'  => $history,
        ]);
    }

    public function deploy(Request $request): JsonResponse
    {
        $request->validate(['project_name' => 'required|string']);

        $projects   = collect(config('projects'));
        $project    = $projects->firstWhere('name', $request->project_name);

        if (!$project) {
            return response()->json(['success' => false, 'error' => 'Project not found.'], 404);
        }

        try {
            $output = $this->ssh->runDeploy($project['deploy_sh']);
            $status = str_contains(strtolower($output), 'error') ? 'failed' : 'success';
        } catch (\Throwable $e) {
            $output = $e->getMessage();
            $status = 'failed';
        }

        DeploymentLog::create([
            'project_name' => $project['name'],
            'branch'       => 'main',
            'status'       => $status,
            'output'       => $output,
        ]);

        return response()->json(['success' => $status === 'success', 'output' => $output]);
    }
}
