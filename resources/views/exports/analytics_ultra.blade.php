<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Laporan Analitik Survei</title>
<style>
  @page { margin: 28mm 18mm 22mm 18mm; }
  body { font-family: DejaVu Sans, Arial, sans-serif; color:#0f172a; font-size: 12px; }
  .banner { background:#0F62FE; color:#fff; padding:18px; text-align:center; border-radius:6px; }
  .title { font-weight:700; font-size:22px; margin:0 0 6px; }
  .subtitle { font-size:13px; opacity:.95; margin:0; }
  .kpi { width:100%; border-collapse: collapse; margin:14px 0 18px; }
  .kpi th { background:#E2E8F0; text-align:left; padding:8px 10px; }
  .kpi td { border:1px solid #D0D7E3; padding:8px 10px; }
  .kpi td:first-child { background:#F1F5F9; font-weight:700; width:35%; }
  h3.sec { font-size:14px; margin:18px 0 6px; }
  .mini { width:100%; border-collapse: collapse; margin:6px 0 8px; }
  .mini td { border:1px solid #D0D7E3; padding:6px 8px; }
  .mini td:first-child { background:#E2E8F0; font-weight:700; width:45%; }
  table.tbl { width:100%; border-collapse: collapse; }
  .tbl th { background:#E2E8F0; padding:8px; text-align:center; }
  .tbl td { border:1px solid #D0D7E3; padding:8px; }
  .tbl tr:nth-child(even) td { background:#F8FAFC; }
  .note { color:#64748B; font-size:10px; margin-top:10px; }
  .sp { height:10px; }
  .muted { color:#64748B; }
</style>
</head>
<body>
  <div class="banner">
    <div class="title">Laporan Analitik Survei</div>
    <div class="subtitle">{{ $survey->title ?? 'Survei' }}</div>
    <div class="subtitle">Dibuat: {{ $generatedAt->format('Y-m-d H:i') }}</div>
  </div>

  <table class="kpi">
    <tr><th>Item</th><th>Nilai</th></tr>
    <tr><td>Survei</td><td>{{ $survey->title ?? 'Survei' }}</td></tr>
    <tr><td>Total Respon</td><td>{{ $stats['totalResponses'] }}</td></tr>
    <tr><td>Total Pertanyaan</td><td>{{ $stats['totalQuestions'] }}</td></tr>
    <tr><td>Completion Rate</td><td>{{ $stats['completionRate'] }}%</td></tr>
  </table>

  @php $sec = 0; @endphp
  @foreach($analytics as $key => $item)
    @php
      $sec++;
      $title = $item['title'] ?? $key;
      $counts = $item['counts'] ?? [];
      $entries = $item['entries'] ?? [];
      $total = $item['total'] ?? array_sum($counts);
      $avg = $item['average'] ?? null;
      $type = $item['type'] ?? '-';
    @endphp

    <h3 class="sec">{{ $sec }}. {{ $title }}</h3>

    <table class="mini">
      <tr><td>Total Respon (pertanyaan)</td><td>{{ $total }}</td></tr>
      <tr><td>Tipe</td><td>{{ is_string($type) ? ucfirst($type) : '-' }}</td></tr>
      <tr><td>Rata-rata</td><td>{{ $avg !== null ? number_format($avg,2) : '-' }}</td></tr>
    </table>

    @if(($item['display'] ?? 'distribution') === 'distribution')
      <table class="tbl">
        <tr>
          <th>Jawaban</th>
          <th>Jumlah Respon</th>
          <th>Persentase</th>
          <th>Rata-rata</th>
        </tr>
        @php $printedAvg = false; @endphp
        @forelse($counts as $label => $cnt)
          <tr>
            <td>{{ $label }}</td>
            <td style="text-align:center">{{ $cnt }}</td>
            <td style="text-align:center">
              {{ $total > 0 ? number_format(($cnt/$total)*100, 2).'%' : '0%' }}
            </td>
            <td style="text-align:center">
              @if(!$printedAvg && $avg !== null) {{ number_format($avg,2) }} @php $printedAvg=true; @endphp @endif
            </td>
          </tr>
        @empty
          <tr>
            <td colspan="4" class="muted">Tidak ada data</td>
          </tr>
        @endforelse
      </table>
    @else
      <table class="tbl">
        <tr><th style="width:8%">No</th><th>Jawaban</th></tr>
        @forelse($entries as $i => $label)
          <tr>
            <td style="text-align:center">{{ $i+1 }}</td>
            <td>{{ $label }}</td>
          </tr>
        @empty
          <tr><td colspan="2" class="muted">Tidak ada data</td></tr>
        @endforelse
      </table>
    @endif

    <div class="sp"></div>
  @endforeach

  <div class="note">Catatan: Grafik rinci tersedia pada berkas Excel (tab "Grafik").</div>
</body>
</html>
