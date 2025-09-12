import { Head, router, usePage } from "@inertiajs/react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { routeOr } from "@/lib/route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SendHorizonal, Snowflake } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type PageProps = {
  survey: { id: number; title: string; slug: string; schema: unknown };
  flash?: { ok?: string };
};

export default function SurveyRun() {
  const { survey, flash } = usePage<PageProps>().props;

  const model = useMemo(() => {
    const m = new Model({
      title: survey.title,
      ...(survey.schema as Record<string, unknown>),
    });
    m.locale = "id";
    m.showTitle = false;
    // Hide built-in Next/Prev since we have a sticky navbar below
    // @ts-ignore - string union supported by SurveyJS ('none'|'top'|'bottom'|'both')
    (m as any).showNavigationButtons = 'none';
    return m;
  }, [survey]);

  const [pageNo, setPageNo] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  useEffect(() => {
    setPageNo(model.currentPageNo);
    setPageCount(model.visiblePageCount);
    const handler = () => {
      setPageNo(model.currentPageNo);
      setPageCount(model.visiblePageCount);
    };
    model.onCurrentPageChanged.add(handler);
    return () => model.onCurrentPageChanged.remove(handler);
  }, [model]);

  const pct = Math.round(((pageNo + 1) / Math.max(1, pageCount)) * 100);
  const canPrev = pageNo > 0;
  const isLast = pageNo === pageCount - 1;
  const steps = Array.from({ length: Math.max(1, pageCount) }, (_, i) => i);
  const surveyRef = useRef<HTMLDivElement | null>(null);

  // Smooth scroll to top on page change (respect reduced motion)
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    // Move focus to the survey region for assistive tech
    surveyRef.current?.focus();
  }, [pageNo]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isLast) model.doComplete(); else model.nextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canPrev) model.prevPage();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isLast) model.doComplete(); else model.nextPage();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [model, isLast, canPrev]);

  useEffect(() => {
    const handler = async (_sender: any, opt: any) => {
      const form = new FormData();
      for (const file of opt.files) form.append("files[]", file);
      const res = await fetch(routeOr('upload.store', undefined, '/upload'), {
        method: 'POST',
        body: form,
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      const data: { urls: string[] } = await res.json();
      opt.callback('success', data.urls.map((url) => ({ file: { name: url, content: url } })));
    };
    model.onUploadFiles.add(handler);
    return () => { model.onUploadFiles.remove(handler); };
  }, [model]);

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
      {/* Soft header with frost icon + chips */}
      <div className="mb-4 flex items-center justify-between rounded-xl border bg-card/70 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/50" data-app-topbar>
        <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <Snowflake className="h-4 w-4 text-primary" />
          <span>Langkah</span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
            {pageNo + 1}
            <span className="opacity-60">/ {pageCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1">
            {steps.map((i) => (
              <span key={i} className={cn('step-dot', i <= pageNo && 'active')} />
            ))}
          </div>
          <div
            className="sejuk-progress h-1.5 w-36 sm:w-44 md:w-56 overflow-hidden rounded-full"
            role="progressbar"
            aria-label="Kemajuan survei"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="sejuk-progress-bar h-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <span className="kbd">Enter</span> untuk {isLast ? 'kirim' : 'lanjut'}
          </div>
        </div>
      </div>
      <Card className="survey-run-card">
        <CardHeader>
          <CardTitle className="text-center text-xl">{survey.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={pageNo}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div ref={surveyRef} tabIndex={-1} aria-label="Area formulir survei" className="outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded">
                <Survey model={model} onComplete={onComplete} />
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
      {/* Sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2 safe-bottom">
          <div className="relative h-8 w-8">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(var(--primary) ${pct * 3.6}deg, color-mix(in oklch, var(--muted-foreground), transparent 80%) 0)`,
              }}
            />
            <div className="absolute inset-1 grid place-items-center rounded-full bg-background text-[10px] font-medium">
              {pct}%
            </div>
          </div>
          <div className="ml-1 text-xs text-muted-foreground">Langkah {pageNo + 1} / {pageCount}</div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => model.prevPage()} disabled={!canPrev} aria-label="Kembali ke halaman sebelumnya">
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden /> Kembali
            </Button>
            {isLast ? (
              <Button onClick={() => model.doComplete()} aria-label="Kirim jawaban survei">
                <SendHorizonal className="mr-1 h-4 w-4" aria-hidden /> Kirim
              </Button>
            ) : (
              <Button onClick={() => model.nextPage()} aria-label="Lanjut ke halaman berikutnya">
                Lanjut <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

