<?php

namespace App\Http\Controllers;

use App\Services\SshService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServicesController extends Controller
{
    public function __construct(private SshService $ssh) {}

    public function index(): Response
    {
        return Inertia::render('Services', [
            'services' => config('services_dashboard'),
        ]);
    }

    public function status(string $unit): JsonResponse
    {
        try {
            $status = $this->ssh->getServiceStatus($unit);
            return response()->json(['success' => true, 'status' => $status]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function control(Request $request): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:start,stop,restart',
            'unit'   => 'required|string',
        ]);

        try {
            $output = $this->ssh->controlService($request->action, $request->unit);
            return response()->json(['success' => true, 'output' => $output]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
