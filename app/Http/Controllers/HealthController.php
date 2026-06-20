<?php

namespace App\Http\Controllers;

use App\Services\SshService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class HealthController extends Controller
{
    public function __construct(private SshService $ssh) {}

    public function index(): Response
    {
        return Inertia::render('Dashboard');
    }

    public function stats(): JsonResponse
    {
        try {
            $data = $this->ssh->getHealth();
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
