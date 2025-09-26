<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Chart\Chart;
use PhpOffice\PhpSpreadsheet\Chart\DataSeries;
use PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues;
use PhpOffice\PhpSpreadsheet\Chart\Legend;
use PhpOffice\PhpSpreadsheet\Chart\PlotArea;
use PhpOffice\PhpSpreadsheet\Chart\Title;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SurveyAnalyticsController extends Controller
{
    public function show(Survey $survey)
    {
        $data = $this->buildAnalyticsPayload($survey);

        return Inertia::render('Surveys/Analytics', [
            'survey' => $survey->only(['id', 'title']),
            'analytics' => $data['analytics'],
            'stats' => $data['stats'],
        ]);
    }

    public function export(Request $request, Survey $survey)
    {
        $format = strtolower($request->query('format', 'excel'));
        $data = $this->buildAnalyticsPayload($survey);
        $fileBase = 'analitik-' . Str::slug($survey->title ?: 'survei') . '-' . now()->format('Ymd-His');

        if ($format === 'pdf') {
            return $this->exportPdf($survey, $data, $fileBase . '.pdf');
        }

        return $this->exportExcel($survey, $data, $fileBase . '.xlsx');
    }

    private function buildAnalyticsPayload(Survey $survey): array
    {
        $responses = $survey->responses()->get(['answers_json']);
        $analytics = [];
        $pages = $survey->schema_json['pages'] ?? [];
        $questionCount = 0;
        $totalAnswered = 0;

        foreach ($pages as $page) {
            foreach ($page['elements'] ?? [] as $question) {
                $name = $question['name'] ?? null;

                if (! $name) {
                    continue;
                }

                $questionCount++;
                $title = $question['title'] ?? $name;

                $counts = [];
                $sum = 0.0;
                $num = 0;

                foreach ($responses as $response) {
                    $entries = $this->extractAnswerEntries($question, $response->answers_json[$name] ?? null);

                    if ($entries === []) {
                        continue;
                    }

                    $totalAnswered++;

                    foreach ($entries as $entry) {
                        $value = $entry['raw'];

                        if (is_numeric($value)) {
                            $sum += (float) $value;
                            $num++;
                        }

                        $label = $entry['label'];
                        $counts[$label] = ($counts[$label] ?? 0) + 1;
                    }
                }

                if ($counts !== []) {
                    arsort($counts, SORT_NUMERIC);
                }

                $analytics[$name] = [
                    'title' => $title,
                    'counts' => $counts,
                    'total' => array_sum($counts),
                    'average' => $num > 0 ? $sum / $num : null,
                ];
            }
        }

        $totalResponses = $responses->count();
        $stats = [
            'totalResponses' => $totalResponses,
            'totalQuestions' => $questionCount,
            'totalAnswered' => $totalAnswered,
            'completionRate' => ($totalResponses > 0 && $questionCount > 0)
                ? (int) round(($totalAnswered / ($totalResponses * $questionCount)) * 100)
                : 0,
        ];

        return [
            'analytics' => $analytics,
            'stats' => $stats,
        ];
    }

    private function extractAnswerEntries(array $question, mixed $answer): array
    {
        $maps = $this->buildQuestionMaps($question);

        return $this->extractEntriesRecursive($answer, $maps);
    }

    private function extractEntriesRecursive(mixed $answer, array $maps, array $contextParts = []): array
    {
        if ($this->isEmptyAnswer($answer)) {
            return [];
        }

        if (is_array($answer)) {
            $entries = [];
            $isAssoc = $this->isAssoc($answer);

            foreach ($answer as $key => $value) {
                if ($this->isEmptyAnswer($value)) {
                    continue;
                }

                $nextContext = $contextParts;

                if ($isAssoc) {
                    $label = $this->resolveOptionLabel(
                        $key,
                        [$maps['rows'], $maps['items'], $maps['columns'], $maps['choices']]
                    ) ?? (string) $key;

                    $nextContext = array_merge($nextContext, [$label]);
                }

                $entries = array_merge(
                    $entries,
                    $this->extractEntriesRecursive($value, $maps, $nextContext)
                );
            }

            return $entries;
        }

        $valueLabel = $this->resolveOptionLabel(
            $answer,
            [$maps['choices'], $maps['columns'], $maps['rateValues'], $maps['rows'], $maps['values'], $maps['options']]
        ) ?? (string) $answer;

        $label = $this->composeLabel(array_merge($contextParts, [$valueLabel]));

        return [[
            'raw' => $answer,
            'label' => $label,
        ]];
    }

    private function buildQuestionMaps(array $question): array
    {
        return [
            'choices' => $this->mapOptions($question['choices'] ?? []),
            'rateValues' => $this->mapOptions($question['rateValues'] ?? []),
            'rows' => $this->mapOptions($question['rows'] ?? []),
            'columns' => $this->mapOptions($question['columns'] ?? []),
            'items' => $this->mapOptions($question['items'] ?? []),
            'values' => $this->mapOptions($question['values'] ?? []),
            'options' => $this->mapOptions($question['options'] ?? []),
        ];
    }

    private function mapOptions(mixed $options): array
    {
        if (! is_array($options)) {
            return [];
        }

        $map = [];

        foreach ($options as $option) {
            if (is_array($option)) {
                $value = $option['value'] ?? $option['id'] ?? $option['name'] ?? null;
                $text = $option['text'] ?? $option['title'] ?? $option['label'] ?? null;

                if ($value === null && $text !== null) {
                    $value = $text;
                }

                if ($value === null) {
                    continue;
                }

                $map[(string) $value] = $text !== null ? (string) $text : (string) $value;
                continue;
            }

            if (is_scalar($option)) {
                $map[(string) $option] = (string) $option;
            }
        }

        return $map;
    }

    private function resolveOptionLabel(mixed $value, array $maps): ?string
    {
        if (is_array($value) || is_object($value)) {
            return null;
        }

        $key = (string) $value;

        foreach ($maps as $map) {
            if (! $map) {
                continue;
            }

            if (array_key_exists($key, $map)) {
                $label = $map[$key];

                if ($label === $key) {
                    return $label;
                }

                if (is_numeric($value)) {
                    return sprintf('%s (%s)', $label, $key);
                }

                return $label;
            }
        }

        return null;
    }

    private function composeLabel(array $parts): string
    {
        $filtered = [];

        foreach ($parts as $part) {
            if ($part === null) {
                continue;
            }

            $part = trim((string) $part);

            if ($part === '' || in_array($part, $filtered, true)) {
                continue;
            }

            $filtered[] = $part;
        }

        return $filtered !== [] ? implode(' – ', $filtered) : '-';
    }

    private function isAssoc(array $array): bool
    {
        return array_keys($array) !== range(0, count($array) - 1);
    }

    private function isEmptyAnswer(mixed $value): bool
    {
        if ($value === null) {
            return true;
        }

        if (is_string($value)) {
            return trim($value) === '';
        }

        if (is_array($value)) {
            if ($value === []) {
                return true;
            }

            foreach ($value as $item) {
                if (! $this->isEmptyAnswer($item)) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    /**
     * @param array{analytics: array<string, array{title?: string, counts: array<string, int>, total: int, average: ?float}>, stats: array<string, int>} $data
     */
    private function exportExcel(Survey $survey, array $data, string $filename): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()->setTitle('Analitik ' . $survey->title);

        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Analitik');

        $sheet->mergeCells('A1:E1');
        $sheet->setCellValue('A1', 'Laporan Analitik Survei');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);

        $sheet->setCellValue('A2', 'Survei');
        $sheet->setCellValue('B2', $survey->title);
        $sheet->setCellValue('A3', 'Total Respon');
        $sheet->setCellValue('B3', $data['stats']['totalResponses']);
        $sheet->setCellValue('A4', 'Total Pertanyaan');
        $sheet->setCellValue('B4', $data['stats']['totalQuestions']);
        $sheet->setCellValue('A5', 'Completion Rate');
        $sheet->setCellValue('B5', $data['stats']['completionRate'] / 100);

        $sheet->getStyle('A2:A5')->getFont()->setBold(true);
        $sheet->getStyle('B5')->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_PERCENTAGE_00);

        $row = 7;
        $headers = ['Pertanyaan', 'Jawaban', 'Jumlah Respon', 'Persentase', 'Rata-rata'];
        $sheet->fromArray($headers, null, "A{$row}");
        $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:E{$row}")->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFE2E8F0');
        $row++;

        $chartRanges = [];

        foreach ($data['analytics'] as $questionKey => $item) {
            $questionTitle = $item['title'] ?? $questionKey;
            $counts = $item['counts'];
            $questionTotal = $item['total'] ?: array_sum($counts);

            if ($counts === []) {
                $sheet->setCellValue("A{$row}", $questionTitle);
                $sheet->setCellValue("B{$row}", 'Tidak ada data');
                $sheet->setCellValue("C{$row}", 0);
                $sheet->setCellValue("D{$row}", 0);
                $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_PERCENTAGE_00);
                $row++;
                $row++;
                continue;
            }

            $questionStart = $row;
            $firstRow = true;

            foreach ($counts as $label => $count) {
                $percentage = $questionTotal > 0 ? $count / $questionTotal : 0;

                $sheet->setCellValue("A{$row}", $firstRow ? $questionTitle : '');
                $sheet->setCellValue("B{$row}", $label);
                $sheet->setCellValue("C{$row}", $count);
                $sheet->setCellValue("D{$row}", $percentage);
                $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_PERCENTAGE_00);

                if ($firstRow) {
                    if ($item['average'] !== null) {
                        $sheet->setCellValue("E{$row}", round($item['average'], 2));
                    }
                }

                $firstRow = false;
                $row++;
            }

            $chartRanges[] = [
                'title' => $questionTitle,
                'start' => $questionStart,
                'end' => $row - 1,
            ];

            $row++;
        }

        $lastDataRow = max(7, $row - 2);

        if ($lastDataRow >= 7) {
            $sheet->getStyle("A7:E{$lastDataRow}")->getBorders()
                ->getAllBorders()->setBorderStyle(Border::BORDER_THIN)
                ->getColor()->setARGB('FFD0D7E3');

            $sheet->getStyle("A7:E{$lastDataRow}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        }

        foreach (['A', 'B', 'C', 'D', 'E'] as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $sheet->freezePane('A8');

        if ($chartRanges !== []) {
            $chartSheet = $spreadsheet->createSheet();
            $chartSheet->setTitle('Grafik');
            $chartRow = 1;

            foreach ($chartRanges as $index => $chartRange) {
                $seriesLabel = [
                    new DataSeriesValues(
                        'String',
                        sprintf('Analitik!$A$%d', $chartRange['start']),
                        null,
                        1
                    ),
                ];

                $categories = [
                    new DataSeriesValues(
                        'String',
                        sprintf('Analitik!$B$%d:$B$%d', $chartRange['start'], $chartRange['end']),
                        null,
                        ($chartRange['end'] - $chartRange['start']) + 1
                    ),
                ];

                $values = [
                    new DataSeriesValues(
                        'Number',
                        sprintf('Analitik!$C$%d:$C$%d', $chartRange['start'], $chartRange['end']),
                        null,
                        ($chartRange['end'] - $chartRange['start']) + 1
                    ),
                ];

                $series = new DataSeries(
                    DataSeries::TYPE_BARCHART,
                    DataSeries::GROUPING_CLUSTERED,
                    range(0, count($values) - 1),
                    $seriesLabel,
                    $categories,
                    $values
                );

                $series->setPlotDirection(DataSeries::DIRECTION_COL);

                $plotArea = new PlotArea(null, [$series]);
                $legend = new Legend(Legend::POSITION_RIGHT, null, false);
                $title = new Title($chartRange['title']);

                $chart = new Chart('chart' . $index, $title, $legend, $plotArea);
                $chart->setTopLeftPosition('A' . $chartRow);
                $chart->setBottomRightPosition('K' . ($chartRow + 14));

                $chartSheet->addChart($chart);
                $chartRow += 16;
            }
        }

        return response()->streamDownload(
            static function () use ($spreadsheet): void {
                $writer = new Xlsx($spreadsheet);
                $writer->setIncludeCharts(true);
                $writer->save('php://output');
                $spreadsheet->disconnectWorksheets();
            },
            $filename,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]
        );
    }

    /**
     * @param array{analytics: array<string, array{title?: string, counts: array<string, int>, total: int, average: ?float}>, stats: array<string, int>} $data
     */
    private function exportPdf(Survey $survey, array $data, string $filename): StreamedResponse
    {
        $html = View::make('exports.analytics', [
            'survey' => $survey,
            'analytics' => $data['analytics'],
            'stats' => $data['stats'],
            'generatedAt' => now(),
        ])->render();

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response()->streamDownload(
            static function () use ($dompdf): void {
                echo $dompdf->output();
            },
            $filename,
            ['Content-Type' => 'application/pdf']
        );
    }
}

