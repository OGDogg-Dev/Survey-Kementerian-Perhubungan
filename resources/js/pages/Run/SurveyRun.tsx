import { Head, router, usePage } from "@inertiajs/react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { routeOr } from "@/lib/route";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FrostCard from "@/components/FrostCard";
import FrostButton from "@/components/FrostButton";
import StepperProgress from "@/components/StepperProgress";
import { ChevronLeft, ChevronRight, SendHorizonal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  const [qTitle, setQTitle] = useState<string>(survey.title);
  const [qDesc, setQDesc] = useState<string | null>(null);
  useEffect(() => {
    setPageNo(model.currentPageNo);
    setPageCount(model.visiblePageCount);
    const computeHeader = () => {
      const p: any = model.currentPage as any;
      const questions: any[] = p?.questions ?? [];
      // Ambil pertanyaan pertama yang terlihat sebagai judul/deskripsi layar
      const first = questions.find((qq: any) => qq?.isVisible !== false) ?? questions[0];
      const title = (first?.title || p?.title || survey.title) as string;
      const desc = (first?.description || p?.description || '') as string;
      setQTitle(title);
      setQDesc(desc || null);
    };
    computeHeader();

    const handler = () => {
      setPageNo(model.currentPageNo);
      setPageCount(model.visiblePageCount);
      computeHeader();
    };
    model.onCurrentPageChanged.add(handler);
    return () => model.onCurrentPageChanged.remove(handler);
  }, [model]);

  const canPrev = pageNo > 0;
  const isLast = pageNo === pageCount - 1;
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
    <div className="min-h-screen bg-snow grid place-items-center p-4">
      <Head title={survey.title} />
      <div className="w-full max-w-2xl">
        {flash?.ok && (
          <Alert className="mb-4">
            <AlertDescription>{flash.ok}</AlertDescription>
          </Alert>
        )}
        <StepperProgress current={pageNo + 1} total={pageCount} />
        <FrostCard className="mt-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-700">{qTitle}</h1>
          {qDesc && <p className="mt-2 text-slate-600">{qDesc}</p>}
          <div className="mt-6">
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
          </div>
          <div className="mt-8 flex justify-between">
            <FrostButton variant="ghost" onClick={() => model.prevPage()} disabled={!canPrev} aria-label="Kembali">
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden /> Kembali
            </FrostButton>
            {isLast ? (
              <FrostButton onClick={() => model.doComplete()} aria-label="Kirim jawaban survei">
                <SendHorizonal className="mr-1 h-4 w-4" aria-hidden /> Kirim
              </FrostButton>
            ) : (
              <FrostButton onClick={() => model.nextPage()} aria-label="Lanjut ke halaman berikutnya">
                Lanjut <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
              </FrostButton>
            )}
          </div>
        </FrostCard>
      </div>
    </div>
  );
}
