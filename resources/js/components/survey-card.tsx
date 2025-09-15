import { Link, router } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { routeOr } from "@/lib/route";

// Avoid relying on a global `route()`; use routeOr with sensible fallbacks.

type SurveyCardProps = {
  survey: {
    id: number;
    title: string;
    slug: string;
    status: "draft" | "published";
    version: number;
    responses_count: number;
  };
  showAnalytics?: boolean;
};

export function SurveyCard({ survey, showAnalytics = false }: SurveyCardProps) {
  const isPublished = survey.status === "published";
  const statusVariant = isPublished ? "default" : "secondary";
  return (
    <Card className="frost-card transition ease-frost hover:shadow-lg hover:shadow-glacier/20">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="truncate text-base md:text-lg font-semibold text-slate-700">
            {survey.title}
          </CardTitle>
          <CardDescription className="truncate text-slate-500">/{survey.slug}</CardDescription>
        </div>
        <Badge
          variant={statusVariant}
          className={`capitalize border ${
            isPublished
              ? 'bg-glacier text-white border-transparent shadow-frost'
              : 'bg-white/80 text-slate-700 border-slate-200 dark:bg-slate-900/70 dark:text-slate-200 dark:border-slate-700/60'
          }`}
          aria-label={`Status ${survey.status}`}
        >
          {survey.status}
        </Badge>
      </CardHeader>
      <CardContent className="flex justify-between text-sm text-slate-600">
        <div>Versi {survey.version}</div>
        <div>{survey.responses_count} respons</div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm(`Hapus survei \"${survey.title}\"? Tindakan ini tidak dapat dibatalkan.`)) {
              router.delete(routeOr("surveys.destroy", survey.id, `/surveys/${survey.id}`));
            }
          }}
        >
          Hapus
        </Button>
        {/* Jadikan Ubah sebagai aksi utama (glacier default) */}
        <Button asChild size="sm">
          <Link href={routeOr("surveys.edit", survey.id, `/surveys/${survey.id}/edit`)}>Ubah</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={routeOr("surveys.responses", survey.id, `/surveys/${survey.id}/responses`)}>Respon</Link>
        </Button>
        {showAnalytics && (
          <Button asChild variant="outline" size="sm">
            <Link href={routeOr("surveys.analytics", survey.id, `/surveys/${survey.id}/analytics`)}>Analitik</Link>
          </Button>
        )}
        {survey.status === "published" && (
          <Button asChild variant="link" size="sm" className="text-glacier hover:text-glacier/80">
            <a
              href={routeOr("run.show", survey.slug, `/s/${survey.slug}`)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Buka survei di tab baru"
            >
              Buka
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
