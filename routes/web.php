<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Survey;

Route::get('/', function () {
    $surveys = Survey::where('status', 'published')
        ->select('id', 'title', 'slug')
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

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/surveys.php';
