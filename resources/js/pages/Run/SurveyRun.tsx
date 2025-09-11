import { Head, router, usePage } from "@inertiajs/react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { routeOr } from "@/lib/route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type PageProps = {
  survey: { id: number; title: string; slug: string; schema: unknown };
  flash?: { ok?: string };
};

export default function SurveyRun() {
  const { survey, flash } = usePage<PageProps>().props;

  const model = new Model({
    title: survey.title,
    ...(survey.schema as Record<string, unknown>)
  });
  model.locale = "id";
  model.showTitle = false;

  model.onUploadFiles.add(async (_sender, opt) => {
    const form = new FormData();
    for (const file of opt.files) form.append("files[]", file);
    const res = await fetch(
      routeOr('upload.store', undefined, '/upload'),
      { method: "POST", body: form, headers: { "X-Requested-With": "XMLHttpRequest" } }
    );
    const data: { urls: string[] } = await res.json();
    opt.callback("success", data.urls.map(url => ({ file: { name: url, content: url } })));
  });

  const onComplete = (s: Model) => {
    router.post(routeOr("run.submit", survey.slug, `/run/${survey.slug}`), {
      answers: s.data,
      meta: { finishedAt: new Date().toISOString() }
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Head title={survey.title} />
      {flash?.ok && (
        <Alert className="mb-4">
          <AlertDescription>{flash.ok}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">{survey.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Survey model={model} onComplete={onComplete} />
        </CardContent>
      </Card>
    </div>
  );
}
