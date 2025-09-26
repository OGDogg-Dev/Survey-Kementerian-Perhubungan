<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use App\Models\SurveyResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SurveyController extends Controller
{
    public function index() {
        $surveys = Survey::select('id','title','slug','status','version','published_at','created_at')
            ->withCount('responses')
            ->latest()
            ->get();
        return Inertia::render('Surveys/Index', compact('surveys'));
    }

    public function create() {
        return Inertia::render('Surveys/Edit', ['survey' => null]);
    }

    public function store(Request $r) {
        $data = $r->validate([
            'title' => 'required|string|max:160',
            'slug' => 'required|string|alpha_dash|unique:surveys,slug|max:160',
            'schema_json' => 'required|array',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after:start_at',
        ]);
        $data['created_by'] = $r->user()?->id;
        $survey = Survey::create($data);
        return redirect()->route('surveys.edit', $survey);
    }

    public function edit(Survey $survey) {
        return Inertia::render('Surveys/Edit', ['survey' => $survey]);
    }

    public function update(Request $r, Survey $survey) {
        $data = $r->validate([
            'title' => 'required|string|max:160',
            'schema_json' => 'required|array',
            'status' => 'in:draft,published',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after:start_at',
        ]);
        $survey->update($data);
        return back()->with('ok','Saved');
    }

    public function publish(Survey $survey) {
        $survey->update([
            'status' => 'published',
            'published_at' => now(),
            'version' => $survey->version + 1
        ]);
        return back()->with('ok','Published');
    }

    public function responses(Survey $survey)
    {
        $definitions = $this->collectQuestionDefinitions($survey);

        $responses = $survey->responses()
            ->select('id', 'response_uuid', 'submitted_at', 'answers_json')
            ->latest('submitted_at')
            ->paginate(20)
            ->through(function (SurveyResponse $response) use ($definitions) {
                $answers = $this->formatAnswers($response->answers_json ?? [], $definitions);

                return [
                    'id' => $response->id,
                    'response_uuid' => $response->response_uuid,
                    'submitted_at' => optional($response->submitted_at)->toIso8601String(),
                    'answers_preview' => array_slice($answers, 0, 3),
                    'answers_count' => count($answers),
                ];
            });

        return Inertia::render('Surveys/Responses', [
            'survey' => $survey->only(['id', 'title', 'slug']),
            'responses' => $responses,
        ]);
    }

    public function responseShow(Survey $survey, SurveyResponse $response)
    {
        abort_unless($response->survey_id === $survey->id, 404);

        $definitions = $this->collectQuestionDefinitions($survey);
        $answers = $this->formatAnswers($response->answers_json ?? [], $definitions);

        return Inertia::render('Surveys/ResponseShow', [
            'survey' => $survey->only(['id', 'title']),
            'response' => [
                'id' => $response->id,
                'response_uuid' => $response->response_uuid,
                'submitted_at' => optional($response->submitted_at)->toIso8601String(),
                'answers' => $answers,
            ],
        ]);
    }

    private function collectQuestionDefinitions(Survey $survey): array
    {
        $definitions = [];
        $pages = $survey->schema_json['pages'] ?? [];

        foreach ($pages as $page) {
            $this->walkSurveyElements($page['elements'] ?? [], $definitions);
        }

        return $definitions;
    }

    private function walkSurveyElements(array $elements, array &$definitions): void
    {
        foreach ($elements as $element) {
            if (!is_array($element)) {
                continue;
            }

            if (isset($element['elements']) && is_array($element['elements'])) {
                $this->walkSurveyElements($element['elements'], $definitions);
            }

            $name = $element['name'] ?? null;
            $type = $element['type'] ?? null;

            if (!$name || !is_string($name) || !$type) {
                continue;
            }

            if (in_array($type, ['panel', 'paneldynamic'], true)) {
                continue;
            }

            if (!isset($definitions[$name])) {
                $definitions[$name] = [
                    'name' => $name,
                    'title' => $this->extractText($element['title'] ?? null) ?? $name,
                    'valueMap' => $this->buildValueLabelMap($element),
                ];
            }
        }
    }

    private function formatAnswers(array $answers, array $definitions): array
    {
        $formatted = [];

        foreach ($definitions as $definition) {
            $name = $definition['name'];
            if (!array_key_exists($name, $answers)) {
                continue;
            }

            $value = $this->presentAnswerValue($answers[$name], $definition['valueMap']);

            $commentKey = $name . '-Comment';
            if (array_key_exists($commentKey, $answers)) {
                $comment = $this->presentAnswerValue($answers[$commentKey], []);
                if ($comment !== '') {
                    $value = $value !== '' ? $value . ' — ' . $comment : $comment;
                }
            }

            if ($value === '') {
                continue;
            }

            $formatted[] = [
                'name' => $name,
                'title' => $definition['title'],
                'value' => $value,
            ];
        }

        return $formatted;
    }

    private function presentAnswerValue($raw, array $map): string
    {
        if ($raw === null || $raw === '') {
            return '';
        }

        if (is_array($raw)) {
            $isAssoc = array_keys($raw) !== range(0, count($raw) - 1);
            $parts = [];

            foreach ($raw as $key => $value) {
                $label = $this->presentAnswerValue($value, $map);
                if ($label === '') {
                    continue;
                }
                if ($isAssoc) {
                    $keyLabel = $this->labelForValue($map, $key);
                    $parts[] = $keyLabel !== '' ? sprintf('%s: %s', $keyLabel, $label) : $label;
                } else {
                    $parts[] = $label;
                }
            }

            $parts = array_filter(array_unique($parts), fn ($part) => $part !== '');
            return implode(', ', $parts);
        }

        return $this->labelForValue($map, $raw);
    }

    private function extractText($value): ?string
    {
        if (is_string($value)) {
            $value = trim($value);
            return $value === '' ? null : $value;
        }

        if (!is_array($value)) {
            return null;
        }

        $locale = app()->getLocale();
        $candidates = [];
        if (is_string($locale) && $locale !== '') {
            $candidates[] = $locale;
            $candidates[] = str_replace('-', '_', $locale);
        }
        $candidates[] = 'default';

        foreach ($candidates as $key) {
            if (isset($value[$key]) && is_string($value[$key])) {
                $text = trim($value[$key]);
                if ($text !== '') {
                    return $text;
                }
            }
        }

        foreach ($value as $candidate) {
            if (is_string($candidate)) {
                $candidate = trim($candidate);
                if ($candidate !== '') {
                    return $candidate;
                }
            }
        }

        return null;
    }

    private function buildValueLabelMap(array $question): array
    {
        $map = [];
        $sources = ['choices', 'rateValues', 'columns', 'rows'];

        foreach ($sources as $source) {
            $entries = $question[$source] ?? null;
            if (!is_array($entries)) {
                continue;
            }
            foreach ($entries as $entry) {
                if (is_string($entry)) {
                    $map[$entry] = $entry;
                    continue;
                }
                if (!is_array($entry)) {
                    continue;
                }
                $value = $entry['value'] ?? ($entry['id'] ?? null);
                if ($value === null && isset($entry['text']) && is_string($entry['text'])) {
                    $value = $entry['text'];
                }
                if ($value === null) {
                    continue;
                }
                $label = $this->extractText($entry['text'] ?? null);
                if ($label === null) {
                    $label = is_scalar($value) ? (string) $value : null;
                }
                if ($label === null) {
                    continue;
                }
                $map[(string) $value] = $label;
            }
        }

        if (($question['type'] ?? null) === 'boolean') {
            $trueLabel = $this->extractText($question['labelTrue'] ?? null);
            $falseLabel = $this->extractText($question['labelFalse'] ?? null);
            if ($trueLabel) {
                $map['true'] = $trueLabel;
            }
            if ($falseLabel) {
                $map['false'] = $falseLabel;
            }
        }

        return $map;
    }

    private function labelForValue(array $map, $value): string
    {
        if (is_bool($value)) {
            $key = $value ? 'true' : 'false';
            return $map[$key] ?? ($value ? 'Ya' : 'Tidak');
        }

        if (is_scalar($value)) {
            $key = (string) $value;
            return $map[$key] ?? $key;
        }

        if (is_array($value)) {
            $labels = [];
            foreach ($value as $entry) {
                $labels[] = $this->labelForValue($map, $entry);
            }
            $labels = array_filter(array_unique($labels), fn ($label) => $label !== '');
            return implode(', ', $labels);
        }

        return (string) $value;
    }

    public function exportJson(Survey $survey) {
        $json = $survey->responses()->latest()->get(['response_uuid','answers_json','submitted_at']);
        return response()->json($json);
    }

    public function exportCsv(Survey $survey): StreamedResponse {
        $filename = 'survey_'.$survey->id.'_responses.csv';
        $rows = $survey->responses()->orderBy('submitted_at')->get();
        $headers = ['Content-Type' => 'text/csv', 'Content-Disposition' => "attachment; filename=\"$filename\""];

        return response()->stream(function() use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['response_uuid','submitted_at','answers_json']);
            foreach ($rows as $r) {
                fputcsv($out, [$r->response_uuid, $r->submitted_at, json_encode($r->answers_json)]);
            }
            fclose($out);
        }, 200, $headers);
    }

    public function destroy(Survey $survey) {
        $survey->delete();
        return redirect()->route('surveys.index')->with('ok', 'Survei dihapus');
    }
}
