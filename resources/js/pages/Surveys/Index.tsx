import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Head } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SurveyCard } from "@/components/survey-card";
import { routeOr } from "@/lib/route";
import type { BreadcrumbItem } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
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

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title="Survei" />
      <div className="min-h-screen bg-[var(--color-snow,#F8FAFC)] -mx-4 sm:mx-0 p-4 sm:p-6 sm:rounded-xl">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold mb-4">Daftar Survei</h1>

          {/* Metrics */}
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <FrostCard>
              <h3 className="text-slate-600">Total Survei</h3>
              <div className="text-2xl font-semibold">{total}</div>
            </FrostCard>
            <FrostCard>
              <h3 className="text-slate-600">Terbit</h3>
              <div className="text-2xl font-semibold">{publishedCount}</div>
            </FrostCard>
            <FrostCard>
              <h3 className="text-slate-600">Total Respon</h3>
              <div className="text-2xl font-semibold">{responsesTotal}</div>
            </FrostCard>
          </div>

          {/* Filters */}
          <FrostCard className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 opacity-60" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tekan / untuk mencari..."
                className="pl-8"
              />
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger className="sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Terbit</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="sm:w-[180px]"><SelectValue placeholder="Urutkan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Terbaru</SelectItem>
                  <SelectItem value="title">Judul (A-Z)</SelectItem>
                  <SelectItem value="responses">Paling banyak respon</SelectItem>
                </SelectContent>
              </Select>
              <Button asChild className="text-primary-foreground dark:text-primary-foreground">
                <Link href={routeOr("surveys.create", undefined, "/surveys/create")}>
                  <Plus className="mr-1 size-4" /> Buat Survei
                </Link>
              </Button>
            </div>
          </FrostCard>
      {isLoading ? (
        <SurveysIndexSkeleton />
      ) : filtered.length > 0 ? (
        <>
          <div className="mb-2 text-xs text-muted-foreground">{filtered.length} hasil</div>
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
        <FrostCard className="text-center p-10">
          <p className="mb-3 text-sm text-muted-foreground">Belum ada survei yang cocok dengan filter.</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" className="text-foreground" onClick={() => { setQuery(""); setStatus("all"); setSort("latest"); }}>Reset filter</Button>
            <Button asChild className="text-primary-foreground dark:text-primary-foreground">
              <Link href={routeOr("surveys.create", undefined, "/surveys/create")}><Plus className="mr-1 size-4" /> Buat survei pertama</Link>
            </Button>
          </div>
        </FrostCard>
      )}
        </div>
      </div>
    </AdminLayout>
  );
}




