import AdminLayout from "@/layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { routeOr } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BreadcrumbItem } from "@/types";

type ResponseRow = { id: number; response_uuid: string; submitted_at: string };
type PageProps = { survey: { id: number; title: string }; responses: { data: ResponseRow[] } };

export default function Responses({ survey, responses }: PageProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: routeOr("dashboard", undefined, "/dashboard") },
    { title: "Survei", href: routeOr("surveys.index", undefined, "/surveys") },
    { title: `Respon: ${survey.title}`, href: routeOr("surveys.responses", survey.id, `/surveys/${survey.id}/responses`) },
  ];
  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title={`Respon - ${survey.title}`} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-700">Respon — {survey.title}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-glacier text-glacier hover:bg-glacier/10">
            <a
              href={routeOr('surveys.export.csv', survey.id, `/surveys/${survey.id}/export/csv`)}
            >
              Ekspor CSV
            </a>
          </Button>
          <Button asChild variant="outline" className="border-glacier text-glacier hover:bg-glacier/10">
            <a
              href={routeOr('surveys.export.json', survey.id, `/surveys/${survey.id}/export/json`)}
            >
              Ekspor JSON
            </a>
          </Button>
        </div>
      </div>
      <Card className="frost-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-700">Daftar Respon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="p-2 font-medium">UUID</th>
                  <th className="p-2 text-center font-medium">Waktu Submit</th>
                  <th className="p-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.data.map((r) => (
                  <tr key={r.id} className="odd:bg-white/40 hover:bg-glacier/5 transition ease-frost">
                    <td className="p-2 font-mono text-[11px] md:text-xs text-slate-700">{r.response_uuid}</td>
                    <td className="p-2 text-center text-slate-700">{r.submitted_at}</td>
                    <td className="p-2 text-right">
                      <Link
                        href={routeOr('surveys.responses.show', [survey.id, r.id], `/surveys/${survey.id}/responses/${r.id}`)}
                        className="text-glacier underline-offset-4 hover:underline"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
