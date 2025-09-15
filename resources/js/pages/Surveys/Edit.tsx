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

/**
 * NOTE: This version is a "nano fix" that keeps your original look & feel.
 * It only tackles the scrollbar layout-shift and a couple of safe UX guards.
 */

type SurveyDTO = { id: number; title: string; schema_json: unknown } | null;

const SurveyCreatorComponentLazy = lazy(async () => {
  await import("survey-creator-core/survey-creator-core.min.css");
  const mod = await import("survey-creator-react");
  return { default: mod.SurveyCreatorComponent };
});

/**
 * Minimal, robust scroll-lock mirroring:
 * - Always reserve scrollbar gutter (CSS)
 * - If body gets scroll-locked by libraries, mirror lock to <html>
 *   and compensate padding-right using the computed scrollbar width variable
 *   so width never changes → no layout shift.
 */
function useMirrorScrollLockToHtml() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Compute and freeze scrollbar width as a CSS var so padding compensation
    // remains correct even after html/body overflow changes.
    const computeSBW = () => {
      // Only compute when not locked to avoid measuring zero width
      if (!html.classList.contains("overlay-lock")) {
        const sbw = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
        html.style.setProperty("--sbw-fixed", `${sbw}px`);
      }
    };

    const apply = () => {
      const bodyComputed = getComputedStyle(body);
      const locked =
        bodyComputed.overflowY === "hidden" ||
        bodyComputed.overflow === "hidden" ||
        body.classList.contains("modal-open");
      html.classList.toggle("overlay-lock", locked);
    };

    const mo = new MutationObserver(apply);
    mo.observe(body, { attributes: true, attributeFilter: ["style", "class"] });
    window.addEventListener("resize", computeSBW);
    window.addEventListener("resize", apply);
    // Initial compute + apply
    computeSBW();
    apply();

    return () => {
      mo.disconnect();
      window.removeEventListener("resize", computeSBW);
      window.removeEventListener("resize", apply);
      html.classList.remove("overlay-lock");
      html.style.removeProperty("--sbw-fixed");
    };
  }, []);
}

export default function Edit({ survey }: { survey: SurveyDTO }) {
  useMirrorScrollLockToHtml();

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
    return () => { active = false; setCreator(null); };
  }, [survey?.schema_json]);

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!survey || !creator) return;
    const handler = () => {
      setDirty(true);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(async () => {
        setSaving(true);
        const payload = {
          title: (creator.JSON?.title as string) || survey.title || "Untitled",
          schema_json: creator.JSON,
        };
        try {
          await fetch(routeOr("surveys.update", survey.id, `/surveys/${survey.id}`), {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
              "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") || "",
            },
            body: JSON.stringify(payload),
            credentials: "same-origin",
          });
        } finally {
          setSaving(false);
          setLastSavedAt(new Date().toLocaleTimeString());
          setDirty(false);
        }
      }, 1000);
    };
    creator.onModified.add(handler);
    return () => creator.onModified.remove(handler);
  }, [creator, survey]);

  // Keep your original DnD guard
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      const types = e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [];
      if (types.includes("Files") || types.includes("text/uri-list")) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      const types = e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [];
      if ((types.includes("Files") || types.includes("text/uri-list")) && editorRef.current && !editorRef.current.contains(e.target as Node)) {
        e.preventDefault(); e.stopPropagation();
      }
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => { window.removeEventListener("dragover", onDragOver); window.removeEventListener("drop", onDrop); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); onSave(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [creator]);

  const onSave = () => {
    const payload = { title: (creator?.JSON?.title as string) || survey?.title || "Untitled", schema_json: creator?.JSON };
    if (survey) {
      fetch(routeOr("surveys.update", survey.id, `/surveys/${survey.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") || "" },
        body: JSON.stringify(payload), credentials: "same-origin",
      }).then(() => { setLastSavedAt(new Date().toLocaleTimeString()); setDirty(false); });
    } else {
      fetch(routeOr("surveys.store", undefined, "/surveys"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") || "" },
        body: JSON.stringify({ ...payload, slug: slugify(payload.title) }), credentials: "same-origin",
      }).then(() => { setLastSavedAt(new Date().toLocaleTimeString()); setDirty(false); });
    }
  };

  const onPublish = () => { if (!survey) return; router.post(routeOr("surveys.publish", survey.id, `/surveys/${survey.id}/publish`)); };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: routeOr("dashboard", undefined, "/dashboard") },
    { title: "Survei", href: routeOr("surveys.index", undefined, "/surveys") },
    { title: survey ? `Edit: ${survey.title}` : "Buat Survei", href: "#" },
  ];

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title={survey ? `Edit: ${survey.title}` : "Buat Survei"}>
        {/* Keep gutter stable & mirror lock to html */}
        <style>{`
          /* Reserve scrollbar space globally to avoid width jumps */
          html{ scrollbar-gutter: stable both-edges; }
          /* JS sets --sbw-fixed on <html>; fallback to 0px */
          :root{ --sbw-fixed: 0px; }
          /* When overlay open (detected via JS), lock <html> and keep width stable */
          html.overlay-lock{ overflow: hidden; padding-right: var(--sbw-fixed); }
          /* Prevent accidental horizontal scroll due to 100vw elements */
          body{ overflow-x: clip; }

          /*
            Scoped Survey Creator layout tweaks
            - Give the editor a comfortable min-height that adapts to viewport
            - Soften background and borders to match app card
            - Constrain side panels so the canvas stays readable
            - Keep styles scoped under .survey-editor-wrap to avoid global impact
          */
          .survey-editor-wrap { --side-w: 320px; --right-w: 360px; }
          .survey-editor-wrap .svc-creator { min-height: max(70vh, 560px); background: transparent; border-radius: 12px; }
          .survey-editor-wrap .svc-creator__content { padding: .25rem; }
          .survey-editor-wrap .svc-toolbox, 
          .survey-editor-wrap .svc-side-bar { width: var(--side-w) !important; max-width: var(--side-w) !important; }
          .survey-editor-wrap .svc-right-container, 
          .survey-editor-wrap .svc-side-bar--right, 
          .survey-editor-wrap .svc-property-grid { width: var(--right-w) !important; max-width: var(--right-w) !important; }
          /* Reduce visual noise in top bars */
          .survey-editor-wrap .svc-tabbed-menu, 
          .survey-editor-wrap .svc-toolbar { background: transparent; box-shadow: none; }
          /* Tighten inner paddings a bit for more canvas space */
          .survey-editor-wrap .svc-tabbed-menu { padding: .25rem .25rem; }
          /* Make canvas slightly brighter inside our card */
          .survey-editor-wrap .sv-root-default-theme, 
          .survey-editor-wrap .sv-root-modern { background-color: transparent; }
        `}</style>
      </Head>

      {/* Top bar */}
      <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 rounded-xl border bg-white/70 px-3 py-2 text-slate-700 backdrop-blur shadow-sm">
        <div className="mr-auto truncate text-sm font-medium">{survey ? `Edit: ${survey.title}` : "Buat Survei"}</div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {saving ? (<span className="inline-flex items-center gap-1"><LoaderCircle className="size-3.5 animate-spin"/> Menyimpan…</span>) : lastSavedAt ? (<span>Tersimpan {lastSavedAt}</span>) : (<span>—</span>)}
          {dirty && !saving && (<span className="text-amber-600">Perubahan belum disimpan</span>)}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onSave} disabled={!creator || saving} aria-label="Simpan survei">{saving && <LoaderCircle className="mr-1 size-4 animate-spin"/>}Simpan</Button>
          </TooltipTrigger>
          <TooltipContent>Simpan perubahan (Ctrl/Cmd + S)</TooltipContent>
        </Tooltip>
        {survey && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" onClick={onPublish} disabled={saving} aria-label="Terbitkan survei">Terbitkan</Button>
            </TooltipTrigger>
            <TooltipContent>Terbitkan versi terbaru</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Editor */}
      <Card>
        <CardContent ref={editorRef} className="p-2 md:p-4">
          {creator ? (
            <Suspense fallback={<Skeleton className="h-[480px] w-full"/>}>
              <div className="survey-editor-wrap">
                <SurveyCreatorComponentLazy creator={creator}/>
              </div>
            </Suspense>
          ) : (
            <Skeleton className="h-[480px] w-full"/>
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
