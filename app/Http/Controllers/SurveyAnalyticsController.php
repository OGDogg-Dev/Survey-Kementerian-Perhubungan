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
                $entriesList = [];
                $isListQuestion = $this->shouldRenderAsList($question);
                $questionType = $question['type'] ?? null;
                $inputType = $question['inputType'] ?? null;

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
                        $entriesList[] = $label;
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
                    'entries' => $entriesList,
                    'display' => $isListQuestion ? 'list' : 'distribution',
                    'type' => $questionType,
                    'inputType' => $inputType,
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

    private function shouldRenderAsList(array $question): bool
    {
        $type = $question['type'] ?? null;

        if ($type === null) {
            return false;
        }

        return in_array($type, ['text', 'comment'], true);
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
     * @param array{analytics: array<string, array{title?: string, counts: array<string, int>, total: int, average: ?float, entries: array<int, string>, display: string, type?: ?string, inputType?: ?string}>, stats: array<string, int>} $data
     */
    private function exportExcel(Survey $survey, array $data, string $filename): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()->setTitle('Analitik ' . $survey->title);

        $COL_PRIMARY = 'FF0F62FE';
        $COL_SURFACE = 'FFF1F5F9';
        $COL_HEADER = 'FFE2E8F0';
        $COL_BORDER = 'FFD0D7E3';
        $COL_ZEBRA = 'FFF8FAFC';

        $thinBorder = (new \PhpOffice\PhpSpreadsheet\Style\Border())
            ->setBorderStyle(Border::BORDER_THIN)
            ->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(substr($COL_BORDER, 2)));

        $applyHeaderRow = static function (\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $worksheet, int $rowIndex, array $labels) use ($COL_BORDER, $COL_HEADER): void {
            foreach ($labels as $columnIndex => $label) {
                $worksheet->setCellValueByColumnAndRow($columnIndex + 1, $rowIndex, $label);
            }

            $lastColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($labels));
            $range = sprintf('A%d:%s%d', $rowIndex, $lastColumn, $rowIndex);

            $worksheet->getStyle($range)->getFont()->setBold(true);
            $worksheet->getStyle($range)->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setARGB($COL_HEADER);
            $worksheet->getStyle($range)->getBorders()->applyFromArray([
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => substr($COL_BORDER, 2)],
                ],
            ]);
        };

        $coverSheet = $spreadsheet->getActiveSheet();
        $coverSheet->setTitle('Cover');

        $coverSheet->mergeCells('A1:H3');
        $coverSheet->setCellValue('A1', 'Laporan Analitik Survei');
        $coverSheet->getStyle('A1')->getFont()->setBold(true)->setSize(20)->getColor()->setARGB('FFFFFFFF');
        $coverSheet->getStyle('A1:H3')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($COL_PRIMARY);
        $coverSheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);

        $coverSheet->mergeCells('A5:H5');
        $coverSheet->setCellValue('A5', $survey->title ?: 'Survei');
        $coverSheet->getStyle('A5')->getFont()->setBold(true)->setSize(14);
        $coverSheet->getStyle('A5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $metaRows = [
            ['Tanggal Generate', now()->format('Y-m-d H:i')],
            ['Total Respon', $data['stats']['totalResponses']],
            ['Completion Rate', $data['stats']['completionRate'] . '%'],
        ];

        $metaRowIndex = 7;
        foreach ($metaRows as $metaRow) {
            list($label, $value) = $metaRow;

            $coverSheet->mergeCells("A{$metaRowIndex}:C{$metaRowIndex}");
            $coverSheet->mergeCells("D{$metaRowIndex}:H{$metaRowIndex}");
            $coverSheet->setCellValue("A{$metaRowIndex}", $label);
            $coverSheet->setCellValue("D{$metaRowIndex}", $value);

            $coverSheet->getStyle("A{$metaRowIndex}:H{$metaRowIndex}")->getBorders()->applyFromArray([
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => substr($COL_BORDER, 2)],
                ],
            ]);
            $coverSheet->getStyle("A{$metaRowIndex}:C{$metaRowIndex}")->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setARGB($COL_HEADER);
            $coverSheet->getStyle("A{$metaRowIndex}")->getFont()->setBold(true);

            $metaRowIndex++;
        }

        foreach (range('A', 'H') as $columnLetter) {
            $coverSheet->getColumnDimension($columnLetter)->setWidth(16);
        }

        $tocSheet = $spreadsheet->createSheet();
        $tocSheet->setTitle('Daftar Isi');
        $tocSheet->fromArray([['Bagian', 'Tujuan', 'Link']], null, 'A1');
        $tocSheet->getStyle('A1:C1')->getFont()->setBold(true);
        $tocSheet->getStyle('A1:C1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($COL_HEADER);
        $tocSheet->fromArray([
            ['Analitik', 'Tabel hasil per pertanyaan', "=HYPERLINK(\"#'Analitik'!A1\",\"Buka\")"],
            ['Grafik', 'Ringkasan grafik batang', "=HYPERLINK(\"#'Grafik'!A1\",\"Buka\")"],
            ['Ringkasan', 'Top pilihan & KPI', "=HYPERLINK(\"#'Ringkasan'!A1\",\"Buka\")"],
            ['Jawaban Teks', 'Daftar jawaban kualitatif', "=HYPERLINK(\"#'Jawaban Teks'!A1\",\"Buka\")"],
        ], null, 'A2');
        $tocSheet->getColumnDimension('A')->setWidth(20);
        $tocSheet->getColumnDimension('B')->setWidth(42);
        $tocSheet->getColumnDimension('C')->setWidth(16);

        $analyticsSheet = $spreadsheet->createSheet();
        $analyticsSheet->setTitle('Analitik');

        $analyticsSheet->mergeCells('A1:F1');
        $analyticsSheet->setCellValue('A1', 'Analitik Survei');
        $analyticsSheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);

        $kpiRows = [
            ['Survei', $survey->title ?: 'Survei'],
            ['Total Respon', $data['stats']['totalResponses']],
            ['Total Pertanyaan', $data['stats']['totalQuestions']],
            ['Completion Rate', $data['stats']['completionRate'] . '%'],
        ];

        $analyticsRowIndex = 3;
        foreach ($kpiRows as $kpiRow) {
            list($label, $value) = $kpiRow;

            $analyticsSheet->mergeCells("A{$analyticsRowIndex}:B{$analyticsRowIndex}");
            $analyticsSheet->mergeCells("C{$analyticsRowIndex}:F{$analyticsRowIndex}");
            $analyticsSheet->setCellValue("A{$analyticsRowIndex}", $label);
            $analyticsSheet->setCellValue("C{$analyticsRowIndex}", $value);

            $analyticsSheet->getStyle("A{$analyticsRowIndex}:F{$analyticsRowIndex}")->getBorders()->applyFromArray([
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => substr($COL_BORDER, 2)],
                ],
            ]);
            $analyticsSheet->getStyle("A{$analyticsRowIndex}:B{$analyticsRowIndex}")->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setARGB($COL_SURFACE);
            $analyticsSheet->getStyle("A{$analyticsRowIndex}")->getFont()->setBold(true);

            $analyticsRowIndex++;
        }

        $analyticsRowIndex++;
        $headers = ['Pertanyaan', 'Jawaban', 'Jumlah Respon', 'Persentase', 'Rata-rata', 'Catatan'];
        $applyHeaderRow($analyticsSheet, $analyticsRowIndex, $headers);
        $analyticsSheet->getStyle(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex))->getBorders()->applyFromArray([
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN,
                'color' => ['argb' => substr($COL_BORDER, 2)],
            ],
        ]);
        $analyticsRowIndex++;

        $chartBlocks = [];
        $questionIndex = 0;

        foreach ($data['analytics'] as $questionKey => $item) {
            $questionIndex++;
            $title = $item['title'] ?? $questionKey;
            $counts = $item['counts'] ?? [];
            $entries = $item['entries'] ?? [];
            $display = $item['display'] ?? 'distribution';
            $total = $item['total'] ?: array_sum($counts);
            $average = $item['average'];

            if ($display === 'list') {
                $analyticsSheet->mergeCells(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex));
                $analyticsSheet->setCellValue("A{$analyticsRowIndex}", sprintf('%d. %s', $questionIndex, $title));
                $analyticsSheet->getStyle(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex))->getFont()->setBold(true)->setSize(12);
                $analyticsSheet->getStyle(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex))->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setARGB($COL_SURFACE);
                $analyticsSheet->getStyle(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex))->getBorders()->applyFromArray([
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['argb' => substr($COL_BORDER, 2)],
                    ],
                ]);
                $analyticsRowIndex++;

                $analyticsSheet->setCellValue("A{$analyticsRowIndex}", 'No');
                $analyticsSheet->setCellValue("B{$analyticsRowIndex}", 'Jawaban');
                $analyticsSheet->mergeCells("C{$analyticsRowIndex}:F{$analyticsRowIndex}");
                $analyticsSheet->getStyle(sprintf('A%d:B%d', $analyticsRowIndex, $analyticsRowIndex))->getFont()->setBold(true);
                $analyticsSheet->getStyle(sprintf('A%d:B%d', $analyticsRowIndex, $analyticsRowIndex))->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setARGB($COL_HEADER);
                $analyticsSheet->getStyle(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex))->getBorders()->applyFromArray([
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['argb' => substr($COL_BORDER, 2)],
                    ],
                ]);
                $analyticsRowIndex++;

                if ($entries === []) {
                    $analyticsSheet->setCellValue("A{$analyticsRowIndex}", '-');
                    $analyticsSheet->setCellValue("B{$analyticsRowIndex}", 'Tidak ada data');
                    $analyticsSheet->mergeCells("C{$analyticsRowIndex}:F{$analyticsRowIndex}");
                    $analyticsSheet->getStyle(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex))->getBorders()->applyFromArray([
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => substr($COL_BORDER, 2)],
                        ],
                    ]);
                    $analyticsRowIndex++;
                } else {
                    foreach ($entries as $entryIndex => $entryLabel) {
                        if (($entryIndex + 1) % 2 === 0) {
                            $analyticsSheet->getStyle(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex))->getFill()
                                ->setFillType(Fill::FILL_SOLID)
                                ->getStartColor()->setARGB($COL_ZEBRA);
                        }

                        $analyticsSheet->setCellValue("A{$analyticsRowIndex}", $entryIndex + 1);
                        $analyticsSheet->setCellValue("B{$analyticsRowIndex}", $entryLabel);
                        $analyticsSheet->mergeCells("C{$analyticsRowIndex}:F{$analyticsRowIndex}");
                        $analyticsSheet->getStyle(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex))->getBorders()->applyFromArray([
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['argb' => substr($COL_BORDER, 2)],
                            ],
                        ]);
                        $analyticsSheet->getStyle("B{$analyticsRowIndex}")->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_CENTER);
                        $analyticsRowIndex++;
                    }
                }

                $analyticsRowIndex++;
                continue;
            }

            $blockStart = $analyticsRowIndex;
            $isFirst = true;

            if ($counts === []) {
                $analyticsSheet->setCellValue("A{$analyticsRowIndex}", $title);
                $analyticsSheet->setCellValue("B{$analyticsRowIndex}", 'Tidak ada data');
                $analyticsSheet->setCellValue("C{$analyticsRowIndex}", 0);
                $analyticsSheet->setCellValue("D{$analyticsRowIndex}", 0);
                $analyticsSheet->getStyle("D{$analyticsRowIndex}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_PERCENTAGE_00);
                $analyticsSheet->getStyle(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex))->getBorders()->applyFromArray([
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['argb' => substr($COL_BORDER, 2)],
                    ],
                ]);
                $analyticsRowIndex++;
            } else {
                foreach ($counts as $label => $count) {
                    if ($analyticsRowIndex % 2 === 0) {
                        $analyticsSheet->getStyle(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex))->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()->setARGB($COL_ZEBRA);
                    }

                    $percentage = $total > 0 ? $count / $total : 0;
                    $analyticsSheet->setCellValue("A{$analyticsRowIndex}", $isFirst ? sprintf('%d. %s', $questionIndex, $title) : '');
                    $analyticsSheet->setCellValue("B{$analyticsRowIndex}", $label);
                    $analyticsSheet->setCellValue("C{$analyticsRowIndex}", $count);
                    $analyticsSheet->setCellValue("D{$analyticsRowIndex}", $percentage);
                    $analyticsSheet->getStyle("D{$analyticsRowIndex}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_PERCENTAGE_00);

                    if ($isFirst && $average !== null) {
                        $analyticsSheet->setCellValue("E{$analyticsRowIndex}", round($average, 2));
                    }

                    $analyticsSheet->getStyle(sprintf('A%d:F%d', $analyticsRowIndex, $analyticsRowIndex))->getBorders()->applyFromArray([
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => substr($COL_BORDER, 2)],
                        ],
                    ]);

                    $isFirst = false;
                    $analyticsRowIndex++;
                }
            }

            $blockEnd = $analyticsRowIndex - 1;
            $chartBlocks[] = [
                'start' => $blockStart,
                'end' => $blockEnd,
                'title' => $title,
            ];

            $analyticsRowIndex++;
        }

        $analyticsSheet->getColumnDimension('A')->setWidth(50);
        $analyticsSheet->getColumnDimension('B')->setWidth(36);
        $analyticsSheet->getColumnDimension('C')->setWidth(18);
        $analyticsSheet->getColumnDimension('D')->setWidth(16);
        $analyticsSheet->getColumnDimension('E')->setWidth(14);
        $analyticsSheet->getColumnDimension('F')->setWidth(22);
        $analyticsSheet->freezePane('A9');

        $chartsSheet = $spreadsheet->createSheet();
        $chartsSheet->setTitle('Grafik');
        $chartAnchorRow = 1;
        $leftColumn = 'A';

        foreach ($chartBlocks as $index => $block) {
            $seriesLabels = [
                new DataSeriesValues(
                    'String',
                    sprintf('Analitik!$A$%d', $block['start']),
                    null,
                    1
                ),
            ];

            $categories = [
                new DataSeriesValues(
                    'String',
                    sprintf('Analitik!$B$%d:$B$%d', $block['start'], $block['end']),
                    null,
                    ($block['end'] - $block['start']) + 1
                ),
            ];

            $values = [
                new DataSeriesValues(
                    'Number',
                    sprintf('Analitik!$C$%d:$C$%d', $block['start'], $block['end']),
                    null,
                    ($block['end'] - $block['start']) + 1
                ),
            ];

            $series = new DataSeries(
                DataSeries::TYPE_BARCHART,
                DataSeries::GROUPING_CLUSTERED,
                range(0, count($values) - 1),
                $seriesLabels,
                $categories,
                $values
            );

            $series->setPlotDirection(DataSeries::DIRECTION_COL);

            $plotArea = new PlotArea(null, [$series]);
            $legend = new Legend(Legend::POSITION_RIGHT, null, false);
            $title = new Title($block['title']);

            $chart = new Chart('chart' . $index, $title, $legend, $plotArea);
            $topLeft = $leftColumn . $chartAnchorRow;
            $bottomRight = ($leftColumn === 'A' ? 'H' : 'P') . ($chartAnchorRow + 14);
            $chart->setTopLeftPosition($topLeft);
            $chart->setBottomRightPosition($bottomRight);

            $chartsSheet->addChart($chart);

            if ($leftColumn === 'A') {
                $leftColumn = 'I';
            } else {
                $leftColumn = 'A';
                $chartAnchorRow += 16;
            }
        }

        $summarySheet = $spreadsheet->createSheet();
        $summarySheet->setTitle('Ringkasan');
        $summarySheet->fromArray([['Ringkasan', 'Nilai']], null, 'A1');
        $summarySheet->getStyle('A1:B1')->getFont()->setBold(true);
        $summarySheet->fromArray([
            ['Total Respon', $data['stats']['totalResponses']],
            ['Completion Rate', $data['stats']['completionRate'] . '%'],
            ['Jumlah Pertanyaan', $data['stats']['totalQuestions']],
            ['', ''],
            ['Top Pilihan (gabungan)', 'Count'],
        ], null, 'A2');
        $summarySheet->getStyle('A6:B6')->getFont()->setBold(true);

        $aggregatedCounts = [];
        foreach ($data['analytics'] as $item) {
            foreach (($item['counts'] ?? []) as $label => $count) {
                $aggregatedCounts[$label] = ($aggregatedCounts[$label] ?? 0) + (int) $count;
            }
        }
        arsort($aggregatedCounts);
        $topChoices = array_slice($aggregatedCounts, 0, 5, true);
        $summaryRow = 7;
        foreach ($topChoices as $label => $count) {
            $summarySheet->setCellValue("A{$summaryRow}", $label);
            $summarySheet->setCellValue("B{$summaryRow}", $count);
            $summaryRow++;
        }
        $summarySheet->getColumnDimension('A')->setWidth(36);
        $summarySheet->getColumnDimension('B')->setWidth(16);

        $textSheet = $spreadsheet->createSheet();
        $textSheet->setTitle('Jawaban Teks');
        $textSheet->fromArray([['Pertanyaan', 'No', 'Jawaban']], null, 'A1');
        $textSheet->getStyle('A1:C1')->getFont()->setBold(true);
        $textSheet->getStyle('A1:C1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($COL_HEADER);

        $textRow = 2;
        foreach ($data['analytics'] as $questionKey => $item) {
            if (($item['display'] ?? 'distribution') !== 'list') {
                continue;
            }

            $questionTitle = $item['title'] ?? $questionKey;
            $entries = $item['entries'] ?? [];

            foreach ($entries as $entryIndex => $entryLabel) {
                $textSheet->setCellValue("A{$textRow}", $questionTitle);
                $textSheet->setCellValue("B{$textRow}", $entryIndex + 1);
                $textSheet->setCellValue("C{$textRow}", $entryLabel);
                $textRow++;
            }
        }

        $textSheet->getColumnDimension('A')->setWidth(40);
        $textSheet->getColumnDimension('B')->setWidth(10);
        $textSheet->getColumnDimension('C')->setWidth(80);

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
        $html = View::make('exports.analytics_ultra', [
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

