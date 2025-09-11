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
      <Card key={key} className="mb-6 card-accent">
        <CardHeader>
          <CardTitle>{data.title ?? key}</CardTitle>
        </CardHeader>
        <CardContent>
          {labels.length > 0 ? (
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
              <BarComponent
                data={{
                  labels,
                  datasets: [
                    {
                      label: "Respon",
                      data: values,
                      backgroundColor: "rgba(59,130,246,0.6)",
                    },
                  ],
                }}
              />
            </Suspense>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada data.</p>
          )}
          {data.average !== null && (
            <p className="mt-3 text-sm text-muted-foreground">Rata-rata: {data.average.toFixed(2)}</p>
          )}
        </CardContent>
      </Card>
    );
  });

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title={`Analitik - ${survey.title}`} />
      <h1 className="mb-6 text-xl font-semibold">Analitik - {survey.title}</h1>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card className="card-accent">
          <CardHeader>
            <CardTitle>Total Respon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalResponses}</div>
            <p className="text-xs text-muted-foreground">Perkiraan total respon</p>
          </CardContent>
        </Card>
        <Card className="card-accent">
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">Perkiraan (min/total)</p>
          </CardContent>
        </Card>
      </div>
      {charts.length > 0 ? charts : (
        <Card className="card-accent">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">Belum ada data analitik.</p>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
