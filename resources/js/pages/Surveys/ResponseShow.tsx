import AdminLayout from "@/layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routeOr } from "@/lib/route";
import type { BreadcrumbItem } from "@/types";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

type AnswerEntry = {
  name: string;
  title: string;
  value: string;
};

type Props = {
  survey: { id?: number; title: string };
  response: { response_uuid: string; submitted_at: string | null; answers: AnswerEntry[] };
};

export default function ResponseShow({ survey, response }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: routeOr("dashboard", undefined, "/dashboard") },
    { title: "Survei", href: routeOr("surveys.index", undefined, "/surveys") },
    { title: `Respon: ${survey.title}`, href: routeOr("surveys.responses", survey.id, `/surveys/${survey.id}/responses`) },
    { title: response.response_uuid.slice(0, 8), href: "#" },
  ];

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title={`Detail Respon – ${survey.title}`} />
      <Card className="frost-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-700">Detail Respon</CardTitle>
          <p className="mt-1 text-sm text-slate-500">UUID {response.response_uuid} · {formatDateTime(response.submitted_at)}</p>
        </CardHeader>
        <CardContent>
          {response.answers.length ? (
            <dl className="space-y-4">
              {response.answers.map((answer) => (
                <div key={answer.name} className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-sm dark:border-slate-600/50 dark:bg-slate-900/60">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {answer.title}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700 dark:text-slate-100">{answer.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Tidak ada jawaban untuk respon ini.</p>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
