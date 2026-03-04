<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

use App\Http\Controllers\AuthController;


Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', [AuthController::class, 'showLogin'])->name('login.form');
Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware('auth')->name('dashboard');

Route::get('/health', function () {
    return response()->json([
        'app' => 'ok',
        'db' => DB::select('SELECT 1 AS ok')[0]->ok ?? null,
        'time' => now()->toDateTimeString(),
    ]);
});

/*

for health check up

open in browser:

http://localhost:8000/health

-- app ok + db 1. means all ok
*/