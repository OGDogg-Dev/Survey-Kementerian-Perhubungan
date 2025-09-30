import { Head, router, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Model, Question } from "survey-core";
import { Survey } from "survey-react-ui";
import { routeOr } from "@/lib/route";
import FrostCard from "@/components/FrostCard";
import FrostButton from "@/components/FrostButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, Edit3, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";



type SurveySessionDTO = {
  token: string;
  answers: Record<string, unknown> | null;
  resume_url?: string | null;
  expires_at?: string | null;
} | null;

type PageProps = {
  survey: { id: number; title: string; slug: string; schema: unknown };
  flash?: { ok?: string };
  session?: SurveySessionDTO;
};

type Mode = "form" | "review";

/**
 * Removed hardcoded CANONICAL_STEP_TITLES to make step titles fully dynamic from survey schema.
 * If a page has no title or stepTitle, fallback to "Langkah {index + 1}".
 */

function formatAnswer(answer: unknown): string {
  if (answer === undefined || answer === null || answer === "") return "Belum diisi";
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "object") return JSON.stringify(answer, null, 2);
  return String(answer);
}

function Stepper({ steps, currentIndex, progress }: { steps: string[]; currentIndex: number; progress: number }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
      <div className="hidden gap-4 md:grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((label, index) => {
          const state = index < currentIndex ? "done" : index === currentIndex ? "active" : "todo";
          return (
            <div key={label} className="flex flex-col items-center text-center">
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-semibold transition",
                  state === "done" && "border-emerald-400 bg-emerald-50 text-emerald-700",
                  state === "active" && "border-sky-500 bg-sky-100 text-sky-700",
                  state === "todo" && "border-slate-200 bg-white text-slate-400"
                )}
              >
                {index + 1}
              </span>
              <span className="mt-2 text-sm font-medium text-slate-600">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between md:hidden">
        <div className="text-sm font-semibold text-slate-700">Langkah {currentIndex + 1}/{steps.length}</div>
        <div className="text-xs text-slate-500">~3 menit lagi</div>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default function SurveyRun() {
  const { survey, flash, session } = usePage<PageProps>().props;
  const [pageNo, setPageNo] = useState(0);
  const [mode, setMode] = useState<Mode>("form");
  const [questionTitle, setQuestionTitle] = useState<string>(survey.title);
  const [questionDesc, setQuestionDesc] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<Record<string, unknown>>({});
  const [sessionToken, setSessionToken] = useState<string | null>(session?.token ?? null);
  const [sessionStatus, setSessionStatus] = useState<"idle" | "saving" | "saved" | "error">(session?.token ? "saved" : "idle");
  const [resumeUrl, setResumeUrl] = useState<string | null>(session?.resume_url ?? null);
  const autosaveTimer = useRef<number | null>(null);
  const allowCompletionRef = useRef(false);
  const surveyRef = useRef<HTMLDivElement | null>(null);


  const applySurveyStyles = useCallback((root?: HTMLElement | null) => {
    const host = root ?? surveyRef.current;
    if (!host) return;

    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    const primary = isDark ? "#E2E8F0" : "#0F172A";
    const secondary = isDark ? "rgba(203,213,225,0.82)" : "#475569";
    const sectionBorder = isDark ? "rgba(148,163,184,0.35)" : "rgba(148,163,184,0.24)";
    const fieldBg = isDark ? "rgba(15,23,42,0.72)" : "#FFFFFF";
    const fieldBorder = isDark ? "rgba(148,163,184,0.5)" : "rgba(148,163,184,0.45)";
    const itemBg = isDark ? "rgba(30,41,59,0.45)" : "rgba(148,163,184,0.12)";
    const itemBgActive = isDark ? "rgba(59,163,244,0.28)" : "rgba(29,127,209,0.16)";
    const ratingAccent = isDark ? "#3BA3F4" : "#1D7FD1";
    const ratingText = isDark ? "#0B1120" : "#FFFFFF";
    const checkMark = isDark ? "#0B1120" : "#FFFFFF";
    const docStyles = typeof window !== "undefined" ? window.getComputedStyle(document.documentElement) : null;
    const rootForeground = docStyles?.getPropertyValue("--foreground")?.trim();
    const fieldTextColor = rootForeground && rootForeground !== "" ? rootForeground : (isDark ? "#E2E8F0" : "#0F172A");
    const placeholderColor = docStyles?.getPropertyValue("--muted-foreground")?.trim() || secondary;
    const questionGlassBg = isDark
      ? "linear-gradient(150deg, rgba(22,33,55,0.82), rgba(9,17,31,0.68))"
      : "linear-gradient(150deg, rgba(255,255,255,0.88), rgba(237,244,255,0.62))";
    const questionGlassOverlay = isDark ? "rgba(17,27,45,0.58)" : "rgba(255,255,255,0.45)";
    const questionGlassBorder = fieldBorder;
    const questionGlassShadow = isDark
      ? "0 28px 70px rgba(2,8,23,0.5), 0 14px 30px rgba(15,23,42,0.3)"
      : "0 26px 56px rgba(15,23,42,0.14), 0 12px 24px rgba(37,99,235,0.12)";
    const questionGlassBackdrop = "blur(24px) saturate(180%)";
    const highlightBg = isDark ? "rgba(250,204,21,0.28)" : "rgba(250,204,21,0.18)";
    const highlightBorder = isDark ? "rgba(250,204,21,0.72)" : "rgba(234,179,8,0.75)";
    const highlightSolid = "#FACC15";
    const highlightText = "#0B1120";
    host.style.setProperty("--sjs-editorfont-color", fieldTextColor);
    host.style.setProperty("--sjs-editorplaceholdercolor", placeholderColor);

    const textSelectors = [
      ".sd-question__title",
      ".sd-panel__title",
      ".sd-element__title",
      ".sd-description",
      ".sd-question__description",
      ".sd-selectbase__label",
      ".sd-selectbase__item",
      ".sd-item__text",
      ".sd-checkbox__label",
      ".sd-radio__label",
      ".sd-checkbox__caption",
      ".sd-radio__caption",
      ".sd-html",
      ".sv-string-viewer",
      ".sd-title__text",
      ".sd-body__navigation-title",
      "label",
      "span"
    ];

    textSelectors.forEach((selector) => {
      host.querySelectorAll<HTMLElement>(selector).forEach((node) => {
        node.style.setProperty("color", primary, "important");
        node.style.removeProperty("opacity");
      });
    });

    host
      .querySelectorAll<HTMLElement>(".sd-description, .sd-question__description, .sd-panel__description")
      .forEach((node) => {
        node.style.setProperty("color", secondary, "important");
      });

    host
      .querySelectorAll<HTMLElement>(".sd-body, .sd-row, .sd-row__question, .sd-page, .sd-panel, .sd-panel__content")
      .forEach((node) => {
        node.style.setProperty("background", "transparent", "important");
        node.style.setProperty("border", "0", "important");
        node.style.setProperty("box-shadow", "none", "important");
        node.style.setProperty("padding", "0", "important");
        node.style.removeProperty("opacity");
      });

    host.querySelectorAll<HTMLElement>(".sd-row").forEach((node) => {
      node.style.setProperty("display", "flex", "important");
      node.style.setProperty("flex-direction", "column", "important");
      node.style.setProperty("gap", "28px", "important");
      node.style.setProperty("margin", "0", "important");
    });

    const enforceQuestionTone = () => {
      host.querySelectorAll<HTMLElement>(".sd-question, .sd-element, .sv_q").forEach((node) => {
        node.style.setProperty("color", primary, "important");
        node.style.setProperty("--sjs-general-forecolor", primary, "important");
        node.style.setProperty("--sjs-questiontitle-forecolor", primary, "important");
        node.style.setProperty("--sjs-answer-foreground-color", fieldTextColor, "important");
        node.style.removeProperty("opacity");
        node
          .querySelectorAll<HTMLElement>(".sd-question__title, .sd-panel__title, .sd-element__title, .sd-title__text, .sv-string-viewer, .sd-html, .sd-description, .sd-question__description, .sd-item__text, label")
          .forEach((el) => {
            el.style.setProperty("color", primary, "important");
            el.style.removeProperty("opacity");
          });
      });
    };

    const questions = Array.from(host.querySelectorAll<HTMLElement>(".sd-question, .sd-element, .sv_q"));
    questions.forEach((node, index) => {
      node.style.setProperty("background", questionGlassBg, "important");
      node.style.setProperty("background-color", questionGlassOverlay, "important");
      node.style.setProperty("border", `1px solid ${questionGlassBorder}`, "important");
      node.style.setProperty("box-shadow", questionGlassShadow, "important");
      node.style.setProperty("padding", "24px 28px", "important");
      node.style.setProperty("margin", index === 0 ? "18px 0 26px" : "28px 0 0", "important");
      node.style.setProperty("border-radius", "22px", "important");
      node.style.setProperty("overflow", "hidden", "important");
      node.style.setProperty("position", "relative", "important");
      node.style.setProperty("isolation", "isolate", "important");
      node.style.setProperty("backdrop-filter", questionGlassBackdrop, "important");
      node.style.setProperty("-webkit-backdrop-filter", questionGlassBackdrop, "important");
      node.style.setProperty("border-bottom", "none", "important");
      node.style.removeProperty("opacity");
    });

    enforceQuestionTone();
    if (typeof window !== "undefined") {
      window.setTimeout(enforceQuestionTone, 30);
      window.setTimeout(enforceQuestionTone, 130);
    }

    host.querySelectorAll<HTMLElement>(".sd-question__header").forEach((node) => {
      node.style.setProperty("margin-bottom", "16px", "important");
    });

    host
      .querySelectorAll<HTMLElement>(".sv-components-column.sv-components-column--expandable")
      .forEach((node) => {
        node.style.setProperty("background-color", "#FFFFFF", "important");
      });

    host
      .querySelectorAll<HTMLElement>("input, textarea, select, .sd-input, .sd-text, .sd-comment, .sd-selectbase, .sv-string-editor, .sd-html input, .sd-html textarea")
      .forEach((node) => {
        node.style.setProperty("color", fieldTextColor, "important");
        node.style.setProperty("-webkit-text-fill-color", fieldTextColor, "important");
        node.style.setProperty("background-color", fieldBg, "important");
        node.style.setProperty("border-color", fieldBorder, "important");
        node.style.setProperty("caret-color", fieldTextColor, "important");
        node.style.removeProperty("opacity");
      });

    host.querySelectorAll<HTMLElement>(".sd-selectbase__item").forEach((node, index) => {
      const isChecked = node.classList.contains("sd-selectbase__item--checked");
      const isCheckbox = node.querySelector(".sd-checkbox__label") !== null;
      const baseBg = fieldBg;
      const baseBorder = fieldBorder;
      const activeBg = isCheckbox
        ? isDark
          ? "rgba(59,130,246,0.24)"
          : "rgba(37,99,235,0.08)"
        : isDark
        ? "rgba(30,64,175,0.28)"
        : "rgba(226,232,240,0.6)";
      const activeBorder = ratingAccent;
      node.style.setProperty("display", "flex", "important");
      node.style.setProperty("align-items", "flex-start", "important");
      node.style.setProperty("gap", "10px", "important");
      node.style.setProperty("border-radius", "10px", "important");
      node.style.setProperty("padding", "10px 14px", "important");
      node.style.setProperty("margin", index === 0 ? "14px 18px 12px" : "12px 18px", "important");
      node.style.setProperty("background-color", isChecked ? activeBg : baseBg, "important");
      node.style.setProperty("border", `1px solid ${isChecked ? activeBorder : baseBorder}`, "important");
      node.style.setProperty("box-shadow", "none", "important");
      node.style.setProperty("transition", "background-color .15s ease, border-color .15s ease", "important");
      node.style.removeProperty("opacity");
      node
        .querySelectorAll<HTMLElement>(".sd-item__text, .sd-checkbox__label, .sd-radio__label")
        .forEach((label) => label.style.setProperty("color", fieldTextColor, "important"));
      const control = node.querySelector<HTMLElement>(".sd-item__control");
      if (control) {
        const controlSize = isCheckbox ? "18px" : "16px";
        control.style.setProperty("width", controlSize, "important");
        control.style.setProperty("height", controlSize, "important");
        control.style.setProperty("min-width", controlSize, "important");
        control.style.setProperty("min-height", controlSize, "important");
        control.style.setProperty("border-radius", isCheckbox ? "4px" : "999px", "important");
        control.style.setProperty("border", `2px solid ${isChecked ? activeBorder : fieldBorder}`, "important");
        control.style.setProperty("background-color", isChecked ? (isCheckbox ? activeBorder : activeBg) : baseBg, "important");
        control.style.setProperty("display", "inline-flex", "important");
        control.style.setProperty("align-items", "center", "important");
        control.style.setProperty("justify-content", "center", "important");
        control.style.setProperty("box-shadow", "none", "important");
        control.style.setProperty("transition", "all .15s ease", "important");
        control
          .querySelectorAll<HTMLElement>("svg, path, use, line, polyline")
          .forEach((icon) => {
            icon.style.setProperty("stroke", isChecked ? (isCheckbox ? checkMark : ratingText) : "transparent", "important");
            icon.style.setProperty("fill", "none", "important");
          });
      }
    });
    host.querySelectorAll<HTMLElement>(".sv-rating__item").forEach((node) => {
      const isSelected = node.classList.contains("sv-rating__item--selected");
      node.style.setProperty("background-color", isSelected ? ratingAccent : itemBg, "important");
      node.style.setProperty("border-color", isSelected ? ratingAccent : fieldBorder, "important");
      node.style.setProperty("color", isSelected ? ratingText : primary, "important");
      node.style.setProperty("box-shadow", "none", "important");
      node.style.setProperty("border-radius", "999px", "important");
    });

    host.querySelectorAll<HTMLElement>(".sv-rating__item-text").forEach((node) => {
      node.style.setProperty("color", secondary, "important");
      node.style.removeProperty("opacity");
    });
  }, []);



  const model = useMemo(() => {
    const m = new Model({
      title: survey.title,
      ...(survey.schema as Record<string, unknown>),
    });
    m.locale = "id";
    m.showTitle = false;
    m.requiredText = "*";
    m.focusFirstQuestionAutomatic = false;
    m.questionErrorLocation = "bottom";
    (m as any).showNavigationButtons = "none";
    return m;
  }, [survey]);

  const saveSessionProgress = useCallback(async () => {
    setSessionStatus("saving");
    try {
      const response = await fetch(routeOr("run.session.store", survey.slug, `/s/${survey.slug}/session`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-XSRF-TOKEN": getCsrfToken(),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          token: sessionToken,
          answers: model.data as Record<string, unknown>,
          meta: { pageNo: model.currentPageNo },
        }),
      });
      if (!response.ok) throw new Error(`Failed to save session: ${response.status}`);
      const payload: { token: string; resume_url: string; expires_at?: string | null } = await response.json();
      setSessionToken(payload.token);
      setResumeUrl(payload.resume_url);
      setSessionStatus("saved");
    } catch (error) {
      console.error(error);
      setSessionStatus("error");
    }
  }, [model, sessionToken, survey.slug]);


  const steps = useMemo(() => {
    const visiblePages = model.visiblePages || [];
    const labels = visiblePages.map((page, index) => {
      const raw = (page as any).stepTitle || page.title;
      const label = typeof raw === "string" && raw.trim() ? raw : `Langkah ${index + 1}`;
      return label;
    });
    return [...labels, "Ringkasan"];
  }, [model]);

  useEffect(() => {
    applySurveyStyles();
  }, [applySurveyStyles]);

  useEffect(() => {
    if (!session?.answers) return;
    const initial = session.answers as Record<string, unknown>;
    if (initial && Object.keys(initial).length) {
      model.data = initial;
    }
  }, [model, session]);

  useEffect(() => {
    const valueHandler = () => applySurveyStyles();
    model.onValueChanged.add(valueHandler);
    return () => {
      model.onValueChanged.remove(valueHandler);
    };
  }, [model, applySurveyStyles]);
  useEffect(() => {
    const handleRender = (_: Model, options: any) => {
      const target = (options?.htmlElement as HTMLElement | null) ?? null;
      const run = () => applySurveyStyles(target);
      if (typeof window !== 'undefined') {
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(run);
        } else {
          window.setTimeout(run, 0);
        }
        window.setTimeout(run, 60);
        window.setTimeout(run, 140);
      } else {
        run();
      }
    };
    model.onAfterRenderPage.add(handleRender);
    model.onAfterRenderQuestion.add(handleRender);
    return () => {
      model.onAfterRenderPage.remove(handleRender);
      model.onAfterRenderQuestion.remove(handleRender);
    };
  }, [model, applySurveyStyles]);

  const updatePageMeta = () => {
    const currentPage = model.currentPage;
    if (!currentPage) return;
    const firstVisibleQuestion = (currentPage.questions || []).find((q: Question) => q.isVisible !== false) as Question | undefined;
    const title = (firstVisibleQuestion?.title || currentPage.title || survey.title) as string;
    const desc = (firstVisibleQuestion?.description || currentPage.description || "") as string;
    setQuestionTitle(title);
    setQuestionDesc(desc || null);
    setPageNo(model.currentPageNo);
    applySurveyStyles();
  };

  useEffect(() => {
    updatePageMeta();
    const onPageChanged = () => {
      setMode("form");
      updatePageMeta();
    };
    model.onCurrentPageChanged.add(onPageChanged);
    return () => model.onCurrentPageChanged.remove(onPageChanged);
  }, [model]);

  useEffect(() => {
    const handleCompleting = (sender: Model, options: any) => {
      if (!allowCompletionRef.current) {
        options.allowComplete = false;
        setReviewData(sender.data as Record<string, unknown>);
        setMode("review");
      } else {
        allowCompletionRef.current = false;
      }
    };
    model.onCompleting.add(handleCompleting);
    return () => model.onCompleting.remove(handleCompleting);
  }, [model]);

  useEffect(() => {
    if (mode !== "form") return;
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    surveyRef.current?.focus();
  }, [pageNo, mode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (mode !== "form") return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        model.isLastPage ? model.doComplete() : model.nextPage();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (model.currentPageNo > 0) model.prevPage();
      } else if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        model.isLastPage ? model.doComplete() : model.nextPage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [model, mode]);
  useEffect(() => {
    const trigger = () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = window.setTimeout(() => {
        saveSessionProgress();
      }, 1200);
    };
    model.onValueChanged.add(trigger);
    model.onCurrentPageChanged.add(trigger);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
      model.onValueChanged.remove(trigger);
      model.onCurrentPageChanged.remove(trigger);
    };
  }, [model, saveSessionProgress]);

  useEffect(() => {
    if (sessionStatus !== "saved") return;
    const timer = window.setTimeout(() => setSessionStatus("idle"), 4000);
    return () => window.clearTimeout(timer);
  }, [sessionStatus]);

  const handleEditSection = (index: number) => {
    model.currentPageNo = index;
    setMode("form");
    updatePageMeta();
  };

  const handlePrev = () => {
    if (mode === "review") {
      setMode("form");
      model.currentPageNo = Math.max(model.visiblePageCount - 1, 0);
      updatePageMeta();
      return;
    }
    if (model.currentPageNo > 0) model.prevPage();
  };

  const handleNext = () => {
    if (mode === "review") return;
    if (model.isLastPage) {
      model.doComplete();
    } else {
      model.nextPage();
    }
  };

  const handleSubmit = () => {
    allowCompletionRef.current = true;
    model.doComplete();
  };

  const progressSteps = steps.length - 1 || 1;
  const currentStepIndex = mode === "review" ? steps.length - 1 : Math.min(pageNo, steps.length - 1);
  const progressPercent = Math.round((currentStepIndex / progressSteps) * 100);

  const sections = useMemo(() => {
    return model.visiblePages.map((page, index) => {
      const questions = (page.questions || []).map((question: Question) => {
        const name = question.name as string;
        const title = (question.title || question.fullTitle || name) as string;
        const value = (question.displayValue ?? reviewData?.[name]) as unknown;
        return { name, title, value: formatAnswer(value) };
      });
      return {
        index,
        title: steps[index] || page.title || `Bagian ${index + 1}`,
        questions,
      };
    });
  }, [model, reviewData, steps]);

  const canGoBack = mode === "review" || model.currentPageNo > 0;
  const nextLabel = mode === "review" ? "Kirim Jawaban" : model.isLastPage ? "Lihat Ringkasan" : "Lanjut";

  const onComplete = (s: Model) => {
    router.post(routeOr("run.submit", survey.slug, `/s/${survey.slug}`), {
      answers: s.data,
      meta: { finishedAt: new Date().toISOString() },
      session_token: sessionToken,
    });
  };

  return (
    <div className="survey-run-surface min-h-screen bg-slate-50">
      <Head title={survey.title} />
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col">
        <div className="flex-1 px-4 pb-28 pt-6 md:px-6 md:pt-10">
          {flash?.ok && (
            <Alert className="mb-4">
              <AlertDescription>{flash.ok}</AlertDescription>
            </Alert>
          )}

          <Stepper steps={steps} currentIndex={currentStepIndex} progress={progressPercent} />

          {mode === "form" ? (
            <FrostCard padded={false} className="survey-run-card mt-6 overflow-hidden">
              <div className="border-b border-white/70 bg-white/80 px-6 py-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {steps[pageNo] ?? `Langkah ${pageNo + 1}`}
                </div>
                <h1 className="mt-2 text-2xl font-semibold text-slate-800 md:text-3xl"></h1>
                {questionDesc && <p className="mt-2 text-sm text-slate-500 md:text-base">{questionDesc}</p>}
              </div>
              <div className="survey-form-body px-4 py-6 md:px-8 md:py-8">
                <div
                  ref={surveyRef}
                  tabIndex={-1}
                  aria-label="Area formulir survei"
                  className="survey-form-shell outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  <Survey model={model} onComplete={onComplete} />
                </div>
              </div>
            </FrostCard>
          ) : (
            <FrostCard padded={false} className="survey-run-card mt-6 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Langkah {steps.length} - Ringkasan</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-800 md:text-3xl">Tinjau jawaban Anda</h1>
                <p className="mt-2 text-sm text-slate-500 md:text-base">
                  Pastikan setiap informasi sudah sesuai. Anda bisa kembali mengubah bagian tertentu sebelum mengirimkan jawaban.
                </p>
              </div>
              <div className="space-y-5">
                {sections.map((section) => (
                  <div key={section.index} className="rounded-2xl border border-slate-200 bg-white/90 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {steps[section.index] ?? `Bagian ${section.index + 1}`}
                        </div>
                        <h2 className="mt-1 text-lg font-semibold text-slate-800">{section.title}</h2>
                      </div>
                      <FrostButton
                        variant="ghost"
                        className="self-start rounded-full px-4 text-sm"
                        onClick={() => handleEditSection(section.index)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" aria-hidden />
                        Edit
                      </FrostButton>
                    </div>
                    <dl className="mt-4 space-y-3">
                      {section.questions.map((question) => (
                        <div key={question.name} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <dt className="text-sm font-semibold text-slate-800">{question.title}</dt>
                          <dd className="mt-3 text-base text-slate-900">{question.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </FrostCard>
          )}
        </div>

<div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-2xl shadow-slate-900/5 backdrop-blur md:px-6">
  <div className="mx-auto w-full max-w-5xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    
    {/* Progress (full width & fleksibel) */}
    <div className="flex flex-col gap-2 order-1 flex-1 w-full">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Kemajuan</span>
        <span>{progressPercent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-sky-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>

    {/* Actions: responsif penuh */}
    <div className="order-2 w-full grid grid-cols-2 gap-3 md:w-auto md:flex md:gap-3 md:flex-none">
      <FrostButton
        variant="ghost"
        className="h-10 w-full rounded-full px-4 text-sm font-semibold md:w-auto"
        onClick={handlePrev}
        disabled={!canGoBack}
      >
        <ChevronLeft className="mr-2 h-4 w-4" aria-hidden />
        Kembali
      </FrostButton>

      {mode === "review" ? (
        <FrostButton
          className="h-10 w-full rounded-full px-4 text-sm font-semibold md:w-auto"
          onClick={handleSubmit}
        >
          <SendHorizontal className="mr-2 h-4 w-4" aria-hidden />
          Kirim
        </FrostButton>
      ) : (
        <FrostButton
          className="h-10 w-full rounded-full px-4 text-sm font-semibold md:w-auto"
          onClick={handleNext}
        >
          {nextLabel}
          {model.isLastPage ? (
            <SendHorizontal className="ml-2 h-4 w-4" aria-hidden />
          ) : (
            <ChevronRight className="ml-2 h-4 w-4" aria-hidden />
          )}
        </FrostButton>
      )}
    </div>
  </div>
</div>


      </div>
    </div>
  );
}

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}







