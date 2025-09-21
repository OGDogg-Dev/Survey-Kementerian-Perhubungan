<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SurveyAnalyticsController;
use App\Models\Survey;

// Explicitly disable service worker. Return 404 for /sw.js quickly.
Route::get('/sw.js', function () {
    return response('', 404)
        ->header('Content-Type', 'application/javascript')
        ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
})->name('sw.js');

Route::get('/', function () {
    $surveys = Survey::published()
        ->select('id', 'title', 'slug')
        ->latest()
        ->get();

    return Inertia::render('landing', [
        'surveys' => $surveys,
    ]);
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

