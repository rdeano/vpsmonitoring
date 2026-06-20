<?php

namespace App\Http\Controllers;

use App\Services\SshService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LogsController extends Controller
{
    public function __construct(private SshService $ssh) {}

    public function index(): Response
    {
        return Inertia::render('Logs', [
            'logFiles' => config('logs'),
        ]);
    }

    public function fetch(Request $request): JsonResponse
    {
        $request->validate([
            'path'  => 'required|string',
            'lines' => 'integer|min:10|max:1000',
        ]);

        try {
            $content = $this->ssh->readLog($request->path, $request->integer('lines', 100));
            return response()->json(['success' => true, 'content' => $content]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
