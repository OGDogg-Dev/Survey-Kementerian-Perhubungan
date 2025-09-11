import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { useMemo } from "react";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-creator-core/survey-creator-core.min.css";
import { routeOr } from "@/lib/route";
import { Button } from "@/components/ui/button";
import type { BreadcrumbItem } from "@/types";

type SurveyDTO = { id: number; title: string; schema_json: unknown } | null;

export default function Edit({ survey }: { survey: SurveyDTO }) {
  const creator = useMemo<SurveyCreator>(() => {
    const c = new SurveyCreator({
      showLogicTab: true,
      isAutoSave: false,
      showThemeTab: true
    });
    if (survey?.schema_json) c.JSON = survey.schema_json;
    return c;
  }, [survey?.schema_json]);

  const onSave = () => {
    const payload = {
      title: (creator.JSON?.title as string) || survey?.title || "Untitled",
      schema_json: creator.JSON
    };
    if (survey) {
      router.put(routeOr('surveys.update', survey.id, `/surveys/${survey.id}`), payload);
    } else {
      router.post(routeOr('surveys.store', undefined, '/surveys'), {
        ...payload,
        slug: slugify(payload.title)
      });
    }
  };

  const onPublish = () => {
    if (!survey) return;
    router.post(routeOr('surveys.publish', survey.id, `/surveys/${survey.id}/publish`));
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: routeOr("dashboard", undefined, "/dashboard") },
    { title: "Survei", href: routeOr("surveys.index", undefined, "/surveys") },
    { title: survey ? `Edit: ${survey.title}` : "Buat Survei", href: "#" },
  ];

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title={survey ? `Edit: ${survey.title}` : "Buat Survei"} />
      <div className="mb-4 flex gap-2">
        <Button onClick={onSave}>Simpan</Button>
        {survey && (
          <Button variant="secondary" onClick={onPublish}>
            Terbitkan
          </Button>
        )}
      </div>
      <div className="rounded-xl border border-border bg-background p-2">
        <SurveyCreatorComponent creator={creator} />
      </div>
    </AdminLayout>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-").slice(0, 64);
}
