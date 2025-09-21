import * as React from "react";
import { Head } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import type { BreadcrumbItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Download } from "lucide-react";

const chartBundle = Promise.all([import("react-chartjs-2"), import("chart.js/auto")]).then(([mod]) => mod);
const Line = React.lazy(() => chartBundle.then((mod) => ({ default: mod.Line })));
const Bar = React.lazy(() => chartBundle.then((mod) => ({ default: mod.Bar })));

const trendData = {
  labels: ["Mei", "Jun", "Jul", "Agu", "Sep"],
  datasets: [
    {
      label: "IKM",
      data: [82, 83, 84, 86, 88],
      borderColor: "#1D7FD1",
      backgroundColor: "rgba(59,163,244,0.1)",
      tension: 0.35,
      fill: true,
    },
  ],
};

const dimensionData = {
  labels: ["Kebersihan", "Keamanan", "Informasi", "Ketepatan", "Petugas"],
  datasets: [
    {
      label: "Skor",
      data: [4.1, 4.3, 3.9, 4.5, 4.0],
      backgroundColor: "rgba(59,163,244,0.65)",
      borderRadius: 12,
      borderSkipped: false,
      maxBarThickness: 48,
    },
  ],
};

const topComplaints = [
  { title: "Toilet kurang bersih", count: 124 },
  { title: "Antrian loket panjang", count: 97 },
  { title: "Informasi jadwal kurang jelas", count: 56 },
];

const responses = [
  {
    id: 1,
    name: "Andi",
    location: "Terminal Manggarai",
    submittedAt: "2025-09-20",
    satisfaction: 4.6,
    feedback: "Perlu tambah petugas saat pagi.",
  },
  {
    id: 2,
    name: "Siti",
    location: "Terminal Purabaya",
    submittedAt: "2025-09-19",
    satisfaction: 4.2,
    feedback: "Toilet bersih tapi sabun habis.",
  },
  {
    id: 3,
    name: "Budi",
    location: "Terminal Giwangan",
    submittedAt: "2025-09-18",
    satisfaction: 3.8,
    feedback: "Informasi jadwal terlambat di-update.",
  },
  {
    id: 4,
    name: "Dewi",
    location: "Terminal Tirtonadi",
    submittedAt: "2025-09-17",
    satisfaction: 4.9,
    feedback: "Petugas ramah dan responsif.",
  },
];

export default function Dashboard() {
  const breadcrumbs: BreadcrumbItem[] = [{ title: "Dashboard", href: "/dashboard" }];

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard Admin" />
      <div className="space-y-8 pb-12">
        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-500">Skor Rata-Rata Terminal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-semibold text-slate-800">4,32</span>
                <Badge variant="secondary" className="rounded-full bg-emerald-100 text-emerald-700">
                  +0,18 vs bulan lalu
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-500">Target minimal 4,00 terlampaui.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-500">Jumlah Responden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-slate-800">1.284</span>
                <span className="text-sm text-emerald-600">+12% minggu ini</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Rata-rata 180 respon per hari kerja.</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-wide text-slate-200">Top 3 Keluhan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topComplaints.map((item, index) => (
                <div key={item.title} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">#{index + 1}</div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-white/15 text-white">
                    {item.count} laporan
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-700">Tren Kepuasan 5 Bulan Terakhir</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <div className="relative h-full -mx-3 overflow-x-auto md:mx-0 md:overflow-visible">
                <div className="h-full min-w-[420px]">
                  <React.Suspense fallback={<Skeleton className="h-full w-full" />}>
                    <Line
                      data={trendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            min: 70,
                            max: 100,
                            ticks: { color: "#64748b" },
                            grid: { color: "rgba(148,163,184,0.25)" },
                          },
                          x: {
                            ticks: { color: "#64748b" },
                            grid: { color: "rgba(148,163,184,0.12)" },
                          },
                        },
                      }}
                    />
                  </React.Suspense>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-700">Skor per Dimensi Pelayanan</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <div className="relative h-full -mx-3 overflow-x-auto md:mx-0 md:overflow-visible">
                <div className="h-full min-w-[360px]">
                  <React.Suspense fallback={<Skeleton className="h-full w-full" />}>
                    <Bar
                      data={dimensionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: { stepSize: 1, color: "#64748b" },
                            grid: { color: "rgba(148,163,184,0.25)" },
                          },
                          x: {
                            ticks: { color: "#64748b" },
                            grid: { display: false },
                          },
                        },
                      }}
                    />
                  </React.Suspense>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader className="border-b border-slate-200/70 pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-700">Respon Terbaru</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Filter berdasarkan tanggal dan terminal untuk analisis cepat.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                      <Calendar className="h-4 w-4 text-slate-400" aria-hidden />
                      <span className="hidden sm:inline">Mulai</span>
                      <Input type="date" className="h-8 border-0 p-0 focus-visible:outline-none focus-visible:ring-0" />
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                      <Calendar className="h-4 w-4 text-slate-400" aria-hidden />
                      <span className="hidden sm:inline">Selesai</span>
                      <Input type="date" className="h-8 border-0 p-0 focus-visible:outline-none focus-visible:ring-0" />
                    </label>
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm shadow-sm">
                      <SelectValue placeholder="Pilih terminal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Terminal</SelectItem>
                      <SelectItem value="manggarai">Terminal Manggarai</SelectItem>
                      <SelectItem value="purabaya">Terminal Purabaya</SelectItem>
                      <SelectItem value="giwangan">Terminal Giwangan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="h-10 rounded-xl px-4 text-sm font-semibold">
                    <Download className="mr-2 h-4 w-4" aria-hidden />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="hidden md:block">
                <table className="min-w-full table-fixed text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-3">Responden</th>
                      <th className="px-6 py-3">Terminal</th>
                      <th className="px-6 py-3">Tanggal</th>
                      <th className="px-6 py-3">Skor</th>
                      <th className="px-6 py-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((row) => (
                      <tr key={row.id} className="border-t border-slate-200/70 text-slate-700">
                        <td className="px-6 py-4 font-medium">{row.name}</td>
                        <td className="px-6 py-4">{row.location}</td>
                        <td className="px-6 py-4">{row.submittedAt}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{row.satisfaction.toFixed(1)}</td>
                        <td className="px-6 py-4 text-slate-500">{row.feedback}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 px-4 py-6 md:hidden">
                {responses.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-base font-semibold text-slate-800">{row.name}</div>
                      <Badge variant="outline" className="rounded-full border-slate-300 text-slate-600">
                        {row.satisfaction.toFixed(1)}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">{row.location}</div>
                    <div className="mt-1 text-xs text-slate-400">{row.submittedAt}</div>
                    <p className="mt-3 text-sm text-slate-600">{row.feedback}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminLayout>
  );
}
