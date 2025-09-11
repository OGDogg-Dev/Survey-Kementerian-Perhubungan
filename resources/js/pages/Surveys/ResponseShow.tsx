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
      <Card>
        <CardHeader>
          <CardTitle>Detail Response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">UUID: {response.response_uuid}</div>
          <div className="text-sm text-muted-foreground">Submitted: {response.submitted_at}</div>
          <div className="rounded-lg bg-muted p-3">
            <pre className="max-h-[60vh] overflow-auto text-xs leading-relaxed">
{JSON.stringify(response.answers_json, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
