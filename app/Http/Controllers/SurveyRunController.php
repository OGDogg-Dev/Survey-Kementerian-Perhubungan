<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\SurveySession;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SurveyRunController extends Controller
{
    private function resolvePublishedSurvey(string $slug): Survey
    {
        $survey = Survey::where('status', 'published')->where('slug', $slug)->firstOrFail();
        $now = now();
        if (($survey->start_at && $now->lt($survey->start_at)) || ($survey->end_at && $now->gt($survey->end_at))) {
            abort(404);
        }

        return $survey;
    }

    public function show(Request $request, string $slug)
    {
        $survey = $this->resolvePublishedSurvey($slug);
        $sessionToken = $request->query('session');
        $session = null;
        if ($sessionToken) {
            $session = SurveySession::where('token', $sessionToken)
                ->where('survey_id', $survey->id)
                ->first();
        }

        return Inertia::render('Run/SurveyRun', [
            'survey' => [
                'id' => $survey->id,
                'title' => $survey->title,
                'slug' => $survey->slug,
                'schema' => $survey->schema_json,
            ],
            'session' => $session ? [
                'token' => $session->token,
                'answers' => $session->answers_json,
                'expires_at' => optional($session->expires_at)->toIso8601String(),
                'resume_url' => route('run.show', ['slug' => $survey->slug, 'session' => $session->token], false),
            ] : null,
        ]);
    }

    public function submit(Request $request, string $slug)
    {
        $survey = $this->resolvePublishedSurvey($slug);
        $data = $request->validate([
            'answers' => 'required|array',
            'meta' => 'nullable|array',
            'session_token' => 'nullable|string',
        ]);

        SurveyResponse::create([
            'survey_id' => $survey->id,
            'response_uuid' => Str::uuid(),
            'user_id' => $request->user()?->id(),
            'answers_json' => $data['answers'],
            'meta_json' => $data['meta'] ?? [
                'ip' => $request->ip(),
                'ua' => $request->userAgent(),
                'referer' => $request->headers->get('referer'),
            ],
            'submitted_at' => now(),
        ]);

        if (!empty($data['session_token'])) {
            SurveySession::where('token', $data['session_token'])->update([
                'completed_at' => now(),
            ]);
        }

        return redirect()->route('run.show', $survey->slug)->with('ok', 'Terima kasih! Respon terekam.');
    }

    public function saveSession(Request $request, string $slug)
    {
        $survey = $this->resolvePublishedSurvey($slug);
        $payload = $request->validate([
            'token' => 'nullable|string|max:64',
            'answers' => 'nullable|array',
            'meta' => 'nullable|array',
        ]);

        $token = $payload['token'] ?: Str::uuid()->toString();
        $session = SurveySession::firstOrNew([
            'token' => $token,
            'survey_id' => $survey->id,
        ]);

        $session->answers_json = Arr::get($payload, 'answers', []);
        $session->meta_json = Arr::get($payload, 'meta', []);
        $session->expires_at = now()->addDays(14);
        $session->save();

        return response()->json([
            'token' => $session->token,
            'resume_url' => route('run.show', ['slug' => $survey->slug, 'session' => $session->token], false),
            'expires_at' => optional($session->expires_at)->toIso8601String(),
        ]);
    }

    public function resume(string $token)
    {
        $session = SurveySession::where('token', $token)->firstOrFail();
        return redirect()->route('run.show', ['slug' => $session->survey->slug, 'session' => $token]);
    }
}
