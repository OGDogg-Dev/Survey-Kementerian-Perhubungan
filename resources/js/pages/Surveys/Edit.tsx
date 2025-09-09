import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { useMemo } from "react";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-creator-core/survey-creator-core.min.css";

declare function route(name: string, params?: unknown): string;

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
  }, [survey?.id, survey?.schema_json]);

  const onSave = () => {
    const payload = {
      title: (creator.JSON?.title as string) || survey?.title || "Untitled",
      schema_json: creator.JSON
    };
    if (survey) {
      router.put(route('surveys.update', survey.id), payload);
    } else {
      router.post(route('surveys.store'), { ...payload, slug: slugify(payload.title) });
    }
  };

  const onPublish = () => {
    if (!survey) return;
    router.post(route('surveys.publish', survey.id));
  };

  return (
    <AdminLayout>
      <Head title={survey ? `Edit: ${survey.title}` : "Buat Survei"} />
      <div className="mb-4 flex gap-2">
        <button onClick={onSave} className="px-4 py-2 rounded bg-blue-600 text-white">Simpan</button>
        {survey && <button onClick={onPublish} className="px-4 py-2 rounded bg-green-600 text-white">Publish</button>}
      </div>
      <SurveyCreatorComponent creator={creator} />
    </AdminLayout>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-").slice(0, 64);
}
