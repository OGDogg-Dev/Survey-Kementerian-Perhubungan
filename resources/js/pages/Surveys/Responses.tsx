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
        <h1 className="text-xl font-semibold">Respon - {survey.title}</h1>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <a
              href={routeOr('surveys.export.csv', survey.id, `/surveys/${survey.id}/export/csv`)}
            >
              Ekspor CSV
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a
              href={routeOr('surveys.export.json', survey.id, `/surveys/${survey.id}/export/json`)}
            >
              Ekspor JSON
            </a>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Respon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="p-2">UUID</th>
                  <th className="p-2 text-center">Waktu Submit</th>
                  <th className="p-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {responses.data.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{r.response_uuid}</td>
                    <td className="p-2 text-center">{r.submitted_at}</td>
                    <td className="p-2 text-right">
                      <Link
                        href={routeOr('surveys.responses.show', [survey.id, r.id], `/surveys/${survey.id}/responses/${r.id}`)}
                        className="text-primary underline-offset-4 hover:underline"
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
