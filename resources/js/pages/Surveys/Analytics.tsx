import { Head } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: routeOr("dashboard", undefined, "/dashboard") },
    { title: "Survei", href: routeOr("surveys.index", undefined, "/surveys") },
    { title: `Analitik: ${survey.title}`, href: routeOr("surveys.analytics", survey.id, `/surveys/${survey.id}/analytics`) },
  ];
  const charts = Object.entries(analytics).map(([key, data]) => {
    const labels = Object.keys(data.counts);
    const values = Object.values(data.counts);
    return (
      <Card key={key} className="mb-6">
        <CardHeader>
          <CardTitle>{data.title ?? key}</CardTitle>
        </CardHeader>
        <CardContent>
          {labels.length > 0 ? (
            <Bar
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
      {charts.length > 0 ? charts : (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">Belum ada data analitik.</p>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
