import AdminLayout from "@/layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { routeOr } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BreadcrumbItem } from "@/types";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

type AnswerPreview = {
  name: string;
  title: string;
  value: string;
};

type ResponseRow = {
  id: number;
  response_uuid: string;
  submitted_at: string | null;
  answers_preview: AnswerPreview[];
  answers_count: number;
};

type Paginated<T> = {
  data: T[];
  next_page_url?: string | null;
  prev_page_url?: string | null;
  links?: Array<{ url: string | null; label: string; active: boolean }>;
};

type PageProps = {
  survey: { id: number; title: string; slug: string };
  responses: Paginated<ResponseRow>;
};

export default function Responses({ survey, responses }: PageProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: routeOr("dashboard", undefined, "/dashboard") },
    { title: "Survei", href: routeOr("surveys.index", undefined, "/surveys") },
    { title: `Respon: ${survey.title}`, href: routeOr("surveys.responses", survey.id, `/surveys/${survey.id}/responses`) },
  ];

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title={`Respon – ${survey.title}`} />
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-700 md:text-3xl">Respon – {survey.title}</h1>
          <p className="mt-1 text-sm text-slate-500">Lihat jawaban yang telah masuk secara ringkas maupun detail.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-glacier text-glacier hover:bg-glacier/10">
            <a href={routeOr("surveys.export.csv", survey.id, `/surveys/${survey.id}/export/csv`)}>Ekspor CSV</a>
          </Button>
          <Button asChild variant="outline" className="border-glacier text-glacier hover:bg-glacier/10">
            <a href={routeOr("surveys.export.json", survey.id, `/surveys/${survey.id}/export/json`)}>Ekspor JSON</a>
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
              <thead className="text-left uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-3 font-medium">UUID</th>
                  <th className="px-2 py-3 font-medium">Waktu Submit</th>
                  <th className="px-2 py-3 font-medium">Ringkasan Jawaban</th>
                  <th className="px-2 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-6 text-center text-sm text-slate-500">
                      Belum ada respon.
                    </td>
                  </tr>
                ) : (
                  responses.data.map((response) => (
                    <tr key={response.id} className="odd:bg-white/40 transition ease-frost hover:bg-glacier/5">
                      <td className="px-2 py-3 font-mono text-[11px] text-slate-700 md:text-xs">
                        {response.response_uuid}
                      </td>
                      <td className="px-2 py-3 text-slate-600">{formatDateTime(response.submitted_at)}</td>
                      <td className="px-2 py-3 align-top text-slate-600">
                        {response.answers_preview.length > 0 ? (
                          <ul className="space-y-1 text-xs md:text-sm">
                            {response.answers_preview.map((answer) => (
                              <li key={answer.name} className="leading-snug">
                                <span className="font-medium text-slate-700">{answer.title}:</span>{" "}
                                <span>{answer.value}</span>
                              </li>
                            ))}
                            {response.answers_count > response.answers_preview.length && (
                              <li className="text-xs text-slate-500">
                                +{response.answers_count - response.answers_preview.length} jawaban lainnya
                              </li>
                            )}
                          </ul>
                        ) : (
                          <span className="text-xs text-slate-500">Tidak ada jawaban.</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <Link
                          href={routeOr(
                            "surveys.responses.show",
                            [survey.id, response.id],
                            `/surveys/${survey.id}/responses/${response.id}`
                          )}
                          className="text-glacier underline-offset-4 hover:underline"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
