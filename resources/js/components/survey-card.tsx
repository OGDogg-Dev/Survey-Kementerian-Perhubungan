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
  const statusVariant = survey.status === "published" ? "default" : "secondary";
  return (
    <Card className="card-accent">
      <CardHeader className="flex flex-row justify-between gap-2">
        <div>
          <CardTitle className="text-base">{survey.title}</CardTitle>
          <CardDescription>/{survey.slug}</CardDescription>
        </div>
        <Badge
          variant={statusVariant}
          className={`capitalize ${survey.status === 'published' ? 'badge-published' : 'badge-draft'}`}
        >
          {survey.status}
        </Badge>
      </CardHeader>
      <CardContent className="flex justify-between text-sm text-muted-foreground">
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
        <Button asChild variant="outline" size="sm" className="text-foreground">
          <Link href={routeOr("surveys.edit", survey.id, `/surveys/${survey.id}/edit`)}>Ubah</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="text-foreground">
          <Link href={routeOr("surveys.responses", survey.id, `/surveys/${survey.id}/responses`)}>Respon</Link>
        </Button>
        {showAnalytics && (
          <Button asChild variant="outline" size="sm" className="text-foreground">
            <Link href={routeOr("surveys.analytics", survey.id, `/surveys/${survey.id}/analytics`)}>Analitik</Link>
          </Button>
        )}
        {survey.status === "published" && (
          <Button asChild variant="link" size="sm">
            <a
              href={routeOr("run.show", survey.slug, `/s/${survey.slug}`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buka
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
