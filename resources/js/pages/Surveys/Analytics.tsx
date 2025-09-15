import { Head } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React, { Suspense } from "react";
import { routeOr } from "@/lib/route";
import type { BreadcrumbItem } from "@/types";

type AnalyticsData = {
  counts: Record<string, number>;
  average: number | null;
  title?: string;
};

type Props = {
  survey: { id: number; title: string };
  analytics: Record<string, AnalyticsData>;
};

export default function Analytics({ survey, analytics }: Props) {
  const BarLazy = React.lazy(() =>
    Promise.all([import("react-chartjs-2"), import("chart.js/auto")]).then(([mod]) => ({
      default: mod.Bar,
    }))
  );
  const BarComponent = BarLazy as unknown as React.ComponentType<any>;
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: routeOr("dashboard", undefined, "/dashboard") },
    { title: "Survei", href: routeOr("surveys.index", undefined, "/surveys") },
    { title: `Analitik: ${survey.title}`, href: routeOr("surveys.analytics", survey.id, `/surveys/${survey.id}/analytics`) },
  ];
  const totals = Object.values(analytics).map((d) =>
    Object.values(d.counts).reduce((a, b) => a + b, 0)
  );
  const totalResponses = totals.length ? Math.max(...totals) : 0;
  const minResponses = totals.length ? Math.min(...totals) : 0;
  const completionRate = totalResponses > 0 ? Math.round((minResponses / totalResponses) * 100) : 0;

  const charts = Object.entries(analytics).map(([key, data]) => {
    const labels = Object.keys(data.counts);
    const values = Object.values(data.counts);
    return (
      <Card key={key} className="mb-6 frost-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-700">{data.title ?? key}</CardTitle>
        </CardHeader>
        <CardContent>
          {labels.length > 0 ? (
            <div className="relative h-60 md:h-72">
              <Suspense fallback={<Skeleton className="h-full w-full" />}>
                <BarComponent
                  data={{
                    labels,
                    datasets: [
                      {
                        label: "Respon",
                        data: values,
                        backgroundColor: "rgba(59,163,244,0.65)",      // glacier  #3BA3F4
                        borderColor: "#1D7FD1",                        // glacier-700
                        borderWidth: 1.5,
                        borderRadius: 8,
                        maxBarThickness: 48
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "rgba(15,23,42,0.9)",        // slate-900/90
                        borderColor: "#1D7FD1",
                        borderWidth: 1,
                        titleColor: "#E2E8F0",
                        bodyColor: "#E2E8F0",
                        padding: 10,
                      },
                    },
                    scales: {
                      x: {
                        ticks: { color: "#64748b" },                   // slate-500
                        grid:  { color: "rgba(148,163,184,0.25)" },    // slate-400/25
                        border: { color: "rgba(148,163,184,0.35)" }
                      },
                      y: {
                        beginAtZero: true,
                        ticks: { color: "#64748b" },
                        grid:  { color: "rgba(148,163,184,0.25)" },
                        border: { color: "rgba(148,163,184,0.35)" }
                      }
                    }
                  }}
                />
              </Suspense>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Tidak ada data.</p>
          )}
          {data.average !== null && (
            <p className="mt-3 text-sm text-slate-500">Rata-rata: {data.average.toFixed(2)}</p>
          )}
        </CardContent>
      </Card>
    );
  });

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title={`Analitik - ${survey.title}`} />
      <h1 className="mb-6 text-2xl md:text-3xl font-semibold text-slate-700">Analitik — {survey.title}</h1>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="frost-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-700">Total Respon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-700">{totalResponses}</div>
            <p className="text-xs text-slate-500">Perkiraan total respon</p>
          </CardContent>
        </Card>
        <Card className="frost-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-700">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-700">{completionRate}%</div>
            <p className="text-xs text-slate-500">Perkiraan (min/total)</p>
          </CardContent>
        </Card>
      </div>
      {charts.length > 0 ? charts : (
        <Card className="frost-card">
          <CardContent className="py-6">
            <p className="text-sm text-slate-500">Belum ada data analitik.</p>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
