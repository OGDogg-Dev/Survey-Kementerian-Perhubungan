<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Analitik {{ $survey->title }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: "DejaVu Sans", Arial, sans-serif; color: #0f172a; font-size: 12px; line-height: 1.5; margin: 0; padding: 28px; }
        h1 { font-size: 20px; margin: 0 0 4px; color: #1e293b; }
        h2 { font-size: 15px; margin: 0 0 12px; color: #1e293b; }
        p { margin: 0 0 12px; }
        .muted { color: #64748b; }
        .summary { margin: 16px 0 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; }
        .summary dl { margin: 0; display: grid; grid-template-columns: 160px auto; row-gap: 6px; column-gap: 12px; }
        .summary dt { font-weight: 600; color: #1e293b; }
        .summary dd { margin: 0; color: #0f172a; }
        .question { page-break-inside: avoid; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
        .question:last-of-type { border-bottom: none; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px 10px; text-align: left; border: 1px solid #e2e8f0; }
        th { background: #e2e8f0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #0f172a; }
        td { vertical-align: middle; font-size: 12px; }
        .bar-cell { width: 45%; }
        .bar { position: relative; height: 12px; background: #e2e8f0; border-radius: 9999px; overflow: hidden; }
        .bar span { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%); border-radius: 9999px; }
        .count, .percent { width: 70px; text-align: right; font-variant-numeric: tabular-nums; }
        .name-list { margin: 0; padding-left: 20px; color: #0f172a; }
        .name-list li { margin-bottom: 6px; }
        .no-data { padding: 12px; background: #f1f5f9; color: #64748b; border-radius: 8px; border: 1px dashed #cbd5f5; }
        .footer { margin-top: 32px; font-size: 11px; color: #64748b; }
    </style>
</head>
<body>
    <h1>Analitik – {{ $survey->title }}</h1>
    <p class="muted">Dibuat pada {{ $generatedAt->timezone(config('app.timezone', 'UTC'))->format('d-m-Y H:i') }}</p>

    <section class="summary">
        <dl>
            <dt>Total Respon</dt>
            <dd>{{ $stats['totalResponses'] }}</dd>
            <dt>Total Pertanyaan</dt>
            <dd>{{ $stats['totalQuestions'] }}</dd>
            <dt>Jawaban Terekam</dt>
            <dd>{{ $stats['totalAnswered'] }}</dd>
            <dt>Completion Rate</dt>
            <dd>{{ $stats['completionRate'] }}%</dd>
        </dl>
    </section>

    @foreach ($analytics as $item)
        @php
            $questionTotal = $item['total'] ?? array_sum($item['counts']);
            $displayMode = $item['display'] ?? 'distribution';
            $entries = $item['entries'] ?? [];
        @endphp
        <section class="question">
            <h2>{{ $item['title'] ?? '-' }}</h2>

            @if ($displayMode === 'list')
                <p class="muted">Total jawaban: {{ count($entries) }}</p>

                @if (!empty($entries))
                    <ol class="name-list">
                        @foreach ($entries as $entry)
                            <li>{{ $entry }}</li>
                        @endforeach
                    </ol>
                @else
                    <div class="no-data">Tidak ada data.</div>
                @endif
            @else
                <p class="muted">Total respon kombinasi: {{ $questionTotal }}</p>

                @if (!empty($item['counts']))
                    <table>
                        <thead>
                            <tr>
                                <th>Jawaban</th>
                                <th class="bar-cell">Visualisasi</th>
                                <th class="count">Jumlah</th>
                                <th class="percent">Persentase</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($item['counts'] as $label => $count)
                                @php
                                    $percentage = $questionTotal > 0 ? ($count / $questionTotal) * 100 : 0;
                                    $width = max(0.0, min(100.0, $percentage));
                                @endphp
                                <tr>
                                    <td>{{ $label }}</td>
                                    <td class="bar-cell">
                                        <div class="bar">
                                            <span style="width: {{ number_format($width, 2, '.', '') }}%"></span>
                                        </div>
                                    </td>
                                    <td class="count">{{ $count }}</td>
                                    <td class="percent">{{ number_format($percentage, 1, ',', '.') }}%</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <div class="no-data">Tidak ada data.</div>
                @endif

                @if (!is_null($item['average']))
                    <p class="muted" style="margin-top: 12px;">Rata-rata nilai: {{ number_format($item['average'], 2, ',', '.') }}</p>
                @endif
            @endif
        </section>
    @endforeach

    <p class="footer">Laporan ini dibuat secara otomatis oleh sistem survei pada {{ config('app.name') }}</p>
</body>
</html>
