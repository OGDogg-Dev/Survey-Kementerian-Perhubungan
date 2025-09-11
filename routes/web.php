<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SurveyAnalyticsController;

Route::get('/', function () {
    return Inertia::render('landing');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('/surveys/{survey}/analytics', [SurveyAnalyticsController::class, 'show'])
        ->name('surveys.analytics');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/surveys.php';
