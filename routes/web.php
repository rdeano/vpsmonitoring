<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeployController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\LogsController;
use App\Http\Controllers\ServicesController;
use Illuminate\Support\Facades\Route;

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');

Route::middleware(\App\Http\Middleware\AuthenticateDashboard::class)->group(function () {
    Route::get('/', [HealthController::class, 'index'])->name('dashboard');
    Route::get('/api/health', [HealthController::class, 'stats'])->name('health.stats');

    Route::get('/deploy', [DeployController::class, 'index'])->name('deploy');
    Route::post('/deploy', [DeployController::class, 'deploy'])->name('deploy.run');

    Route::get('/services', [ServicesController::class, 'index'])->name('services');
    Route::get('/api/services/{unit}/status', [ServicesController::class, 'status'])->name('services.status');
    Route::post('/services/control', [ServicesController::class, 'control'])->name('services.control');

    Route::get('/logs', [LogsController::class, 'index'])->name('logs');
    Route::post('/api/logs/fetch', [LogsController::class, 'fetch'])->name('logs.fetch');

    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});
