import AdminLayout from "@/layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routeOr } from "@/lib/route";
import type { BreadcrumbItem } from "@/types";

type Props = {
  survey: { title: string };
  response: { response_uuid: string; submitted_at: string; answers_json: unknown };
};

export default function ResponseShow({ survey, response }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: routeOr("dashboard", undefined, "/dashboard") },
    { title: "Survei", href: routeOr("surveys.index", undefined, "/surveys") },
    { title: `Respon: ${survey.title}`, href: "#" },
  ];
  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title={`Respon - ${survey.title}`} />
      <Card className="frost-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-700">Detail Respon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-slate-500">UUID: {response.response_uuid}</div>
          <div className="text-sm text-slate-500">Submitted: {response.submitted_at}</div>
          <div className="rounded-xl border border-white/60 bg-white/70 backdrop-blur p-3 dark:bg-slate-900/70 dark:border-slate-700/50">
            <pre className="max-h-[60vh] overflow-auto text-xs leading-relaxed text-slate-700 dark:text-slate-200">
{JSON.stringify(response.answers_json, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
