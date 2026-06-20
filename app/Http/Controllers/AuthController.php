<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (session('dashboard_authenticated')) {
            return redirect()->route('dashboard');
        }
        return Inertia::render('Login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $validUsername = env('DASHBOARD_USERNAME', 'admin');
        $validPassword = env('DASHBOARD_PASSWORD', '');

        $usernameMatches = $request->username === $validUsername;
        $isBcrypt        = str_starts_with($validPassword, '$2y$') || str_starts_with($validPassword, '$2a$');
        $passwordMatches = $isBcrypt
            ? Hash::check($request->password, $validPassword)
            : $request->password === $validPassword;

        if ($usernameMatches && $passwordMatches) {
            $request->session()->put('dashboard_authenticated', true);
            $request->session()->regenerate();
            return redirect()->route('dashboard');
        }

        return back()->withErrors(['username' => 'Invalid credentials.']);
    }

    public function logout(Request $request)
    {
        $request->session()->forget('dashboard_authenticated');
        $request->session()->regenerate();
        return redirect()->route('login');
    }
}
