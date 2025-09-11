import { Head } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

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
  const charts = Object.entries(analytics).map(([key, data]) => {
    const labels = Object.keys(data.counts);
    const values = Object.values(data.counts);
    return (
      <div key={key} className="mb-8">
        <h2 className="mb-2 font-medium">{data.title ?? key}</h2>
        {labels.length > 0 ? (
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: "Responses",
                  data: values,
                  backgroundColor: "rgba(59,130,246,0.5)",
                },
              ],
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No data</p>
        )}
        {data.average !== null && (
          <p className="mt-2 text-sm">Average: {data.average.toFixed(2)}</p>
        )}
      </div>
    );
  });

  return (
    <AdminLayout>
      <Head title={`Analytics - ${survey.title}`} />
      <h1 className="mb-4 text-xl font-semibold">
        Analytics for {survey.title}
      </h1>
      {charts.length > 0 ? charts : (
        <p className="text-sm text-muted-foreground">No analytics available.</p>
      )}
    </AdminLayout>
  );
}
