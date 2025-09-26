import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import { Link, Head } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SurveyCard } from "@/components/survey-card";
import { routeOr } from "@/lib/route";
import type { BreadcrumbItem } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, ClipboardList, Filter, Plus, Search, Sparkles, X } from "lucide-react";
import { usePageLoading } from "@/hooks/use-page-loading";
import { SurveysIndexSkeleton } from "@/components/skeletons/surveys-index-skeleton";
import { AnimatePresence, motion } from "framer-motion";
import FrostCard from "@/components/FrostCard";

type SurveyRow = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published";
  version: number;
  responses_count: number;
  published_at?: string;
  created_at: string;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

type MetricCardProps = {
  label: string;
  value: ReactNode;
  helper: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent: string;
};

const MetricCard = ({ label, value, helper, icon: Icon, accent }: MetricCardProps) => (
  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80">
    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${accent}`}>
      <Icon className="h-5 w-5" aria-hidden />
    </span>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-400">{helper}</p>
    </div>
  </div>
);



export default function Index({ surveys }: { surveys: SurveyRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "published">("all");
  const [sort, setSort] = useState<"latest" | "title" | "responses">("latest");
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setQuery("");
        searchRef.current?.blur();
      }
      if ((e.key === "n" || e.key === "N") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        window.location.assign(routeOr("surveys.create", undefined, "/surveys/create"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    let rows = surveys;
    if (status !== "all") rows = rows.filter((s) => s.status === status);
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((s) => `${s.title} ${s.slug}`.toLowerCase().includes(q));
    }
    switch (sort) {
      case "title":
        rows = [...rows].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "responses":
        rows = [...rows].sort((a, b) => b.responses_count - a.responses_count);
        break;
      default:
        rows = [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return rows;
  }, [surveys, status, query, sort]);
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: routeOr("dashboard", undefined, "/dashboard") },
    { title: "Survei", href: routeOr("surveys.index", undefined, "/surveys") },
  ];
  const isLoading = usePageLoading();
  const total = surveys.length;
  const publishedCount = useMemo(() => surveys.filter((s) => s.status === 'published').length, [surveys]);
  const responsesTotal = useMemo(() => surveys.reduce((acc, s) => acc + s.responses_count, 0), [surveys]);

  const metrics = useMemo<MetricCardProps[]>(
    () => [
      {
        label: "Total Survei",
        value: numberFormatter.format(total),
        helper: "Termasuk draft & terbit",
        icon: ClipboardList,
        accent: "bg-sky-100 text-sky-700 dark:bg-slate-800/80 dark:text-sky-300",
      },
      {
        label: "Terbit",
        value: numberFormatter.format(publishedCount),
        helper: "Siap dikumpulkan",
        icon: Sparkles,
        accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
      },
      {
        label: "Total Respon",
        value: numberFormatter.format(responsesTotal),
        helper: "Akumulasi respon masuk",
        icon: BarChart3,
        accent: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-200",
      },
    ],
    [total, publishedCount, responsesTotal],
  );

  const activeFilters = useMemo(
    () =>
      [
        query
          ? {
              label: `Kata kunci: "${query}"`,
              onClear: () => setQuery(""),
            }
          : null,
        status !== "all"
          ? {
              label: `Status: ${status === "draft" ? "Draft" : "Terbit"}`,
              onClear: () => setStatus("all"),
            }
          : null,
        sort !== "latest"
          ? {
              label:
                sort === "title"
                  ? "Urut: Judul"
                  : sort === "responses"
                    ? "Urut: Respon terbanyak"
                    : "Urut: Terbaru",
              onClear: () => setSort("latest"),
            }
          : null,
      ].filter(Boolean) as Array<{ label: string; onClear: () => void }>,
    [query, status, sort],
  );

  const hasActiveFilters = activeFilters.length > 0;

  const handleResetFilters = () => {
    setQuery("");
    setStatus("all");
    setSort("latest");
  };

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title="Survei" />
      <div className="min-h-screen bg-[var(--color-snow,#F8FAFC)] -mx-4 sm:mx-0 p-4 sm:p-6 sm:rounded-xl">
        <div className="mx-auto max-w-6xl">
          <FrostCard className="mb-6 overflow-hidden border border-slate-200/80 bg-gradient-to-br from-sky-50 via-white to-slate-100 shadow-sm dark:border-slate-700/60 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/40">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-center">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:bg-slate-900/60 dark:text-sky-300">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Pusat Survei
                </span>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 md:text-3xl">Kelola survei dengan percaya diri</h1>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 md:text-base">
                    Pantau status, performa, dan respon terkini tanpa meninggalkan halaman ini.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="rounded-full px-5 text-sm font-semibold">
                    <Link href={routeOr("surveys.create", undefined, "/surveys/create")} className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" aria-hidden />
                      Buat survei baru
                    </Link>
                  </Button>
                  
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>
            </div>
          </FrostCard>


{/* Filters */}
<FrostCard className="mb-6 space-y-4 bg-white/95 dark:bg-slate-900/70">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="relative w-full sm:w-80">
      <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <Input
        ref={searchRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tekan / untuk mencari..."
        className="pl-8 bg-white/95 text-slate-800 placeholder:text-slate-400 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400"
      />
    </div>
    <div className="flex w-full flex-col gap-1 sm:w-56">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Status</span>
      <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
        <SelectTrigger className="w-full bg-white/95 text-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
          <SelectValue placeholder="Pilih status" />
        </SelectTrigger>
        <SelectContent className="bg-white/95 text-slate-700 dark:bg-slate-900/90 dark:text-slate-100">
          <SelectItem className="text-slate-700 dark:text-slate-100 data-[state=checked]:bg-sky-100 data-[state=checked]:text-slate-800 data-[state=checked]:dark:bg-slate-700 data-[state=checked]:dark:text-white" value="all">
            Semua
          </SelectItem>
          <SelectItem className="text-slate-700 dark:text-slate-100 data-[state=checked]:bg-sky-100 data-[state=checked]:text-slate-800 data-[state=checked]:dark:bg-slate-700 data-[state=checked]:dark:text-white" value="draft">
            Draft
          </SelectItem>
          <SelectItem className="text-slate-700 dark:text-slate-100 data-[state=checked]:bg-sky-100 data-[state=checked]:text-slate-800 data-[state=checked]:dark:bg-slate-700 data-[state=checked]:dark:text-white" value="published">
            Terbit
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="flex w-full flex-col gap-1 sm:w-60">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Urutkan</span>
      <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
        <SelectTrigger className="w-full bg-white/95 text-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
          <SelectValue placeholder="Urutkan" />
        </SelectTrigger>
        <SelectContent className="bg-white/95 text-slate-700 dark:bg-slate-900/90 dark:text-slate-100">
          <SelectItem className="text-slate-700 dark:text-slate-100 data-[state=checked]:bg-sky-100 data-[state=checked]:text-slate-800 data-[state=checked]:dark:bg-slate-700 data-[state=checked]:dark:text-white" value="latest">
            Terbaru
          </SelectItem>
          <SelectItem className="text-slate-700 dark:text-slate-100 data-[state=checked]:bg-sky-100 data-[state=checked]:text-slate-800 data-[state=checked]:dark:bg-slate-700 data-[state=checked]:dark:text-white" value="title">
            Judul (A-Z)
          </SelectItem>
          <SelectItem className="text-slate-700 dark:text-slate-100 data-[state=checked]:bg-sky-100 data-[state=checked]:text-slate-800 data-[state=checked]:dark:bg-slate-700 data-[state=checked]:dark:text-white" value="responses">
            Paling banyak respon
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="flex w-full flex-col gap-1 sm:w-auto">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Aksi</span>
      <Button asChild className="w-full rounded-full text-primary-foreground sm:w-auto">
        <Link href={routeOr("surveys.create", undefined, "/surveys/create")} className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" aria-hidden />
          Buat Survei
        </Link>
      </Button>
    </div>
  </div>
  {hasActiveFilters ? (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-200">
        <Filter className="h-3.5 w-3.5" aria-hidden />
        Filter aktif:
      </span>
      {activeFilters.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClear}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
        >
          {item.label}
          <X className="h-3 w-3" aria-hidden />
        </button>
      ))}
      <Button
        variant="ghost"
        className="h-auto rounded-full px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-200"
        onClick={handleResetFilters}
      >
        Reset semua
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-slate-500 dark:bg-slate-900/60 dark:text-slate-300">
      <Filter className="h-3.5 w-3.5" aria-hidden />
      <span>Gunakan pencarian, status, atau urutan untuk mempersempit daftar survei.</span>
    </div>
  )}
</FrostCard>

      {isLoading ? (
        <SurveysIndexSkeleton />
      ) : filtered.length > 0 ? (
        <>
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} hasil ditampilkan</span>
            {hasActiveFilters ? (
              <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
                Filter aktif
              </span>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  whileHover={{ y: -2 }}
                >
                  <SurveyCard survey={s} showAnalytics />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <FrostCard className="flex flex-col items-center gap-4 bg-white/95 p-12 text-center dark:bg-slate-900/70">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-slate-800/80 dark:text-sky-300">
            <ClipboardList className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-100">Tidak ada survei sesuai filter</p>
            <p className="mt-1 text-sm text-muted-foreground">Coba ubah kata kunci atau tampilkan semua status untuk melihat survei lainnya.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" className="text-foreground" onClick={handleResetFilters}>
              Reset filter
            </Button>
            <Button asChild className="text-primary-foreground dark:text-primary-foreground">
              <Link href={routeOr("surveys.create", undefined, "/surveys/create")}>
                <Plus className="mr-1 h-4 w-4" aria-hidden /> Buat survei pertama
              </Link>
            </Button>
          </div>
        </FrostCard>
      )}
        </div>
      </div>
    </AdminLayout>
  );
}






