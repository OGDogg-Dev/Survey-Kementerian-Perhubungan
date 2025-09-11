<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use Inertia\Inertia;

class SurveyAnalyticsController extends Controller
{
    public function show(Survey $survey)
    {
        $responses = $survey->responses()->get(['answers_json']);
        $analytics = [];

        $pages = $survey->schema_json['pages'] ?? [];
        foreach ($pages as $page) {
            foreach ($page['elements'] ?? [] as $question) {
                $name = $question['name'] ?? null;
                if (!$name) {
                    continue;
                }
                $title = $question['title'] ?? $name;
                $values = [];
                foreach ($responses as $response) {
                    $ans = $response->answers_json[$name] ?? null;
                    if ($ans === null || $ans === '') {
                        continue;
                    }
                    $values[] = $ans;
                }
                if (empty($values)) {
                    $analytics[$name] = [
                        'title' => $title,
                        'counts' => [],
                        'average' => null,
                    ];
                    continue;
                }
                $counts = [];
                $sum = 0;
                $num = 0;
                foreach ($values as $v) {
                    if (is_numeric($v)) {
                        $sum += (float) $v;
                        $num++;
                    }
                    $key = (string) $v;
                    $counts[$key] = ($counts[$key] ?? 0) + 1;
                }
                $analytics[$name] = [
                    'title' => $title,
                    'counts' => $counts,
                    'average' => $num > 0 ? $sum / $num : null,
                ];
            }
        }

        return Inertia::render('Surveys/Analytics', [
            'survey' => $survey->only(['id', 'title']),
            'analytics' => $analytics,
        ]);
    }
}
