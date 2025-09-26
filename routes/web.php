<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use App\Http\Controllers\SurveyAnalyticsController;
use App\Models\Survey;
use App\Models\SurveyResponse;

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
    $stringify = function ($value) {
        if (is_array($value)) {
            $items = [];
            array_walk_recursive($value, function ($item) use (&$items) {
                if (is_scalar($item)) {
                    $trimmed = trim((string) $item);
                    if ($trimmed !== '') {
                        $items[] = $trimmed;
                    }
                }
            });

            $items = array_values(array_unique($items));

            return $items ? implode(', ', $items) : null;
        }

        if (is_bool($value)) {
            return $value ? 'Ya' : 'Tidak';
        }

        if (is_scalar($value)) {
            $trimmed = trim((string) $value);

            return $trimmed !== '' ? $trimmed : null;
        }

        return null;
    };

    $firstMatching = function (array $flat, array $keywords) use ($stringify) {
        foreach ($flat as $key => $value) {
            $candidate = $stringify($value);

            if ($candidate === null) {
                continue;
            }

            $lowerKey = Str::lower($key);

            foreach ($keywords as $keyword) {
                if (Str::contains($lowerKey, $keyword)) {
                    return $candidate;
                }
            }
        }

        return null;
    };

    $firstString = function (array $flat) use ($stringify) {
        foreach ($flat as $value) {
            $candidate = $stringify($value);

            if ($candidate !== null && ! is_numeric($candidate)) {
                return $candidate;
            }
        }

        return null;
    };

    $extractSatisfaction = function (array $flat) {
        $keywords = ['kepuasan', 'satisfaction', 'rating', 'skala', 'penilaian', 'score', 'skor', 'nilai'];

        foreach ($flat as $key => $value) {
            if (! is_numeric($value)) {
                continue;
            }

            $lowerKey = Str::lower($key);

            foreach ($keywords as $keyword) {
                if (Str::contains($lowerKey, $keyword)) {
                    return (float) $value;
                }
            }
        }

        foreach ($flat as $value) {
            if (is_numeric($value)) {
                return (float) $value;
            }
        }

        return null;
    };

    $latestResponses = SurveyResponse::query()
        ->with('survey:id,title')
        ->latest('submitted_at')
        ->limit(8)
        ->get()
        ->map(function (SurveyResponse $response) use ($firstMatching, $firstString, $extractSatisfaction, $stringify) {
            $answers = $response->answers_json ?? [];
            $flat = Arr::dot($answers);

            $name = $firstMatching($flat, ['nama', 'name', 'responden']);
            $location = $firstMatching($flat, ['terminal', 'lokasi', 'location', 'asal', 'tujuan']);
            $feedback = $firstMatching($flat, ['saran', 'masukan', 'feedback', 'komentar', 'catatan', 'keluhan']) ?? $firstString($flat);
            $satisfaction = $extractSatisfaction($flat);

            if (! $name) {
                $name = 'Responden Anonim';
            }

            if (! $location) {
                $location = $response->survey?->title;
            }

            return [
                'id' => $response->id,
                'name' => $name,
                'location' => $location,
                'surveyTitle' => $response->survey?->title,
                'submittedAt' => optional($response->submitted_at)->toIso8601String(),
                'satisfaction' => $satisfaction,
                'feedback' => $feedback,
            ];
        })
        ->values();

    $satisfactionValues = SurveyResponse::query()
        ->latest('submitted_at')
        ->limit(500)
        ->get()
        ->map(function (SurveyResponse $response) use ($extractSatisfaction) {
            $flat = Arr::dot($response->answers_json ?? []);

            return $extractSatisfaction($flat);
        })
        ->filter(fn ($value) => $value !== null)
        ->values();

    $averageSatisfaction = $satisfactionValues->isNotEmpty()
        ? round($satisfactionValues->average(), 2)
        : null;

    $positiveFeedbackShare = $satisfactionValues->isNotEmpty()
        ? (int) round($satisfactionValues->filter(fn ($value) => $value >= 4.5)->count() / $satisfactionValues->count() * 100)
        : null;

    $now = now();

    $metrics = [
        'averageSatisfaction' => $averageSatisfaction,
        'positiveFeedbackShare' => $positiveFeedbackShare,
        'totalResponses' => SurveyResponse::count(),
        'responsesLast7Days' => SurveyResponse::where('submitted_at', '>=', $now->copy()->subDays(7))->count(),
        'responsesLast30Days' => SurveyResponse::where('submitted_at', '>=', $now->copy()->subDays(30))->count(),
        'activeSurveys' => Survey::published()->count(),
    ];

    return Inertia::render('dashboard', [
        'latestResponses' => $latestResponses,
        'metrics' => $metrics,
    ]);
})->name('dashboard');
});

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('/surveys/{survey}/analytics', [SurveyAnalyticsController::class, 'show'])
        ->name('surveys.analytics');
    Route::get('/surveys/{survey}/analytics/export', [SurveyAnalyticsController::class, 'export'])
        ->name('surveys.analytics.export');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/surveys.php';

