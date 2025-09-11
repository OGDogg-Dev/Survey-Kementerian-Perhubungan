import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { useMemo, useState } from "react";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-creator-core/survey-creator-core.min.css";

declare function route(name: string, params?: unknown): string;

type SurveyDTO =
  | {
      id: number;
      title: string;
      schema_json: unknown;
      start_at: string | null;
      end_at: string | null;
    }
  | null;

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

  const [startAt, setStartAt] = useState<string>(survey?.start_at?.slice(0, 16) ?? "");
  const [endAt, setEndAt] = useState<string>(survey?.end_at?.slice(0, 16) ?? "");

  const onSave = () => {
    const payload = {
      title: (creator.JSON?.title as string) || survey?.title || "Untitled",
      schema_json: creator.JSON,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null
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
      <div className="mb-4 flex gap-4">
        <div className="flex flex-col">
          <label className="text-sm mb-1">Start At</label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={e => setStartAt(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">End At</label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={e => setEndAt(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>
      <SurveyCreatorComponent creator={creator} />
    </AdminLayout>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-").slice(0, 64);
}
