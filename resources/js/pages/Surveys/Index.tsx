import { useState } from "react";
import { Link, Head } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SurveyCard } from "@/components/survey-card";
import { routeOr } from "@/lib/route";

type SurveyRow = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published";
  version: number;
  responses_count: number;
  published_at?: string;
  created_at: string;
};

export default function Index({ surveys }: { surveys: SurveyRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = surveys.filter((s) =>
    `${s.title} ${s.slug}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AdminLayout>
      <Head title="Surveys" />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Surveys</h1>
        <div className="flex w-full gap-2 sm:w-auto">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari..."
            className="sm:w-64"
          />
          <Button asChild>
            <Link href={routeOr("surveys.create", undefined, "/surveys/create")}>Buat Survei</Link>
          </Button>
        </div>
      </div>
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <SurveyCard key={s.id} survey={s} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Tidak ada survei.</p>
      )}
    </AdminLayout>
  );
}
