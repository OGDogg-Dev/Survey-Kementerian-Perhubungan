import { Link } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { routeOr } from "@/lib/route";

type SurveyCardProps = {
  survey: {
    id: number;
    title: string;
    slug: string;
    status: "draft" | "published";
    version: number;
    responses_count: number;
  };
};

export function SurveyCard({ survey }: SurveyCardProps) {
  const statusVariant = survey.status === "published" ? "default" : "secondary";
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between gap-2">
        <div>
          <CardTitle className="text-base">{survey.title}</CardTitle>
          <CardDescription>/{survey.slug}</CardDescription>
        </div>
        <Badge variant={statusVariant} className="capitalize">
          {survey.status}
        </Badge>
      </CardHeader>
      <CardContent className="flex justify-between text-sm text-muted-foreground">
        <div>Versi {survey.version}</div>
        <div>{survey.responses_count} respons</div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={routeOr("surveys.edit", survey.id, `/surveys/${survey.id}/edit`)}>Edit</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={routeOr("surveys.responses", survey.id, `/surveys/${survey.id}/responses`)}>Responses</Link>
        </Button>
        {survey.status === "published" && (
          <Button asChild variant="link" size="sm">
            <a href={routeOr("run.show", survey.slug, `/run/${survey.slug}`)} target="_blank" rel="noopener noreferrer">
              Open
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
