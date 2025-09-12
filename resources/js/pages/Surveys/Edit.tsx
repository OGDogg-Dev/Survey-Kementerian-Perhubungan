import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { useEffect, useRef, useState, Suspense, lazy } from "react";
import type { SurveyCreator } from "survey-creator-react";
import { routeOr } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BreadcrumbItem } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LoaderCircle } from "lucide-react";

type SurveyDTO = { id: number; title: string; schema_json: unknown } | null;

const SurveyCreatorComponentLazy = lazy(async () => {
  await import("survey-creator-core/survey-creator-core.min.css");
  const mod = await import("survey-creator-react");
  return { default: mod.SurveyCreatorComponent };
});

export default function Edit({ survey }: { survey: SurveyDTO }) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [creator, setCreator] = useState<SurveyCreator | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      const { SurveyCreator } = await import("survey-creator-react");
      const c = new SurveyCreator({ showLogicTab: true, isAutoSave: false, showThemeTab: true });
      if (survey?.schema_json) c.JSON = survey.schema_json as any;
      if (active) setCreator(c);
    })();
    return () => {
      active = false;
      setCreator(null);
    };
  }, [survey?.schema_json]);

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Autosave for existing survey
  useEffect(() => {
    if (!survey || !creator) return;
    const handler = () => {
      setDirty(true);
      if (debounceRef.current) window.clearTimeout(debounceRef.current!);
      debounceRef.current = window.setTimeout(async () => {
        setSaving(true);
        const payload = {
          title: (creator.JSON?.title as string) || survey.title || "Untitled",
          schema_json: creator.JSON,
        };
        try {
          await fetch(routeOr("surveys.update", survey.id, `/surveys/${survey.id}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            body: JSON.stringify(payload),
            credentials: 'same-origin',
          });
        } finally {
          setSaving(false);
          setLastSavedAt(new Date().toLocaleTimeString());
          setDirty(false);
        }
      }, 1200);
    };
    creator.onModified.add(handler);
    return () => creator.onModified.remove(handler);
  }, [creator, survey]);

  // Prevent browser from navigating on external file/URL drops while editing
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      const types = e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [];
      if (types.includes('Files') || types.includes('text/uri-list')) {
        e.preventDefault();
      }
    };
    const onDrop = (e: DragEvent) => {
      const types = e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [];
      // Allow internal editor DnD, but block external files/URLs that cause navigation
      if (types.includes('Files') || types.includes('text/uri-list')) {
        // If dropped outside the editor container, prevent default navigation
        const target = e.target as Node | null;
        if (editorRef.current && target && !editorRef.current.contains(target)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  // Ctrl/Cmd + S shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [creator]);

  const onSave = () => {
    const payload = {
      title: (creator?.JSON?.title as string) || survey?.title || "Untitled",
      schema_json: creator?.JSON,
    };
    if (survey) {
      fetch(routeOr("surveys.update", survey.id, `/surveys/${survey.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
        },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      }).then(() => {
        setLastSavedAt(new Date().toLocaleTimeString());
        setDirty(false);
      });
    } else {
      fetch(routeOr("surveys.store", undefined, "/surveys"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
        },
        body: JSON.stringify({
          ...payload,
          slug: slugify(payload.title),
        }),
        credentials: 'same-origin',
      }).then(() => {
        setLastSavedAt(new Date().toLocaleTimeString());
        setDirty(false);
      });
    }
  };

  const onPublish = () => {
    if (!survey) return;
    router.post(routeOr("surveys.publish", survey.id, `/surveys/${survey.id}/publish`));
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: routeOr("dashboard", undefined, "/dashboard") },
    { title: "Survei", href: routeOr("surveys.index", undefined, "/surveys") },
    { title: survey ? `Edit: ${survey.title}` : "Buat Survei", href: "#" },
  ];

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title={survey ? `Edit: ${survey.title}` : "Buat Survei"} />
      <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 rounded-xl border bg-card/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mr-auto text-sm font-medium">{survey ? `Edit: ${survey.title}` : "Buat Survei"}</div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {saving ? (
            <span className="inline-flex items-center gap-1"><LoaderCircle className="size-3.5 animate-spin" /> Menyimpan...</span>
          ) : lastSavedAt ? (
            <span>Tersimpan {lastSavedAt}</span>
          ) : (
            <span>—</span>
          )}
          {dirty && !saving && <span className="text-amber-600">Perubahan belum disimpan</span>}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onSave} disabled={!creator || saving} aria-label="Simpan survei">
              {saving && <LoaderCircle className="mr-1 size-4 animate-spin" />}Simpan
            </Button>
          </TooltipTrigger>
          <TooltipContent>Simpan perubahan (Ctrl/Cmd + S)</TooltipContent>
        </Tooltip>
        {survey && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" onClick={onPublish} disabled={saving} aria-label="Terbitkan survei">
                Terbitkan
              </Button>
            </TooltipTrigger>
            <TooltipContent>Terbitkan versi terbaru</TooltipContent>
          </Tooltip>
        )}
        {survey && (
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm(`Hapus survei \"${survey.title}\"? Tindakan ini tidak dapat dibatalkan.`)) {
                router.delete(routeOr("surveys.destroy", survey.id, `/surveys/${survey.id}`));
              }
            }}
            aria-label="Hapus survei"
          >
            Hapus
          </Button>
        )}
      </div>
      <Card className="card-accent">
        <CardContent ref={editorRef} className="p-2">
          {creator ? (
            <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
              <SurveyCreatorComponentLazy creator={creator} />
            </Suspense>
          ) : (
            <Skeleton className="h-[480px] w-full" />
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-").slice(0, 64);
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}
