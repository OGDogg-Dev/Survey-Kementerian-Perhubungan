import * as React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { routeOr } from "@/lib/route";

// ---------- UI Primitives ----------
type FrostButtonProps = React.ComponentProps<typeof Button> & {
  variant?: "default" | "secondary";
};

function FrostButton({ className, variant = "default", ...props }: FrostButtonProps) {
  return (
    <Button
      variant={variant === "secondary" ? "secondary" : "default"}
      className={cn(
        "rounded-2xl px-5 h-11 shadow-sm transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
}

function FrostCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        // Frosted-glass look without needing custom CSS
        "rounded-3xl border bg-white/70 backdrop-blur-xl shadow-sm ring-1 ring-black/5",
        "p-6",
        className
      )}
      {...props}
    />
  );
}

// ---------- Helpers ----------
function useFilteredSurveys<T extends { title: string; slug: string }>(surveys: T[] | undefined, q: string) {
  const query = q.trim().toLowerCase();
  return React.useMemo(() => {
    if (!surveys?.length) return [] as T[];
    if (!query) return surveys;
    return surveys.filter((s) =>
      [s.title, s.slug].some((v) => v?.toLowerCase().includes(query))
    );
  }, [surveys, query]);
}

export default function LandingPage() {
  const startHref = routeOr("surveys.index", undefined, "/surveys");
  const { surveys } = usePage().props as {
    surveys: { id: number; title: string; slug: string }[] | undefined;
  };

  const [q, setQ] = React.useState("");
  const [lang, setLang] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      return url.searchParams.get("lang") || "id";
    }
    return "id";
  });

  const filtered = useFilteredSurveys(surveys, q);

  function switchLang(next: string) {
    setLang(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.location.assign(url.toString());
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Aurora background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50" />
        <div className="absolute -top-32 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-400/20 via-blue-300/10 to-indigo-300/10 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-cyan-300/20 via-emerald-300/10 to-transparent blur-3xl" />
      </div>

      <Head title="Bantu kami jadi lebih baik" />

      <div className="mx-auto w-full max-w-4xl px-5 py-10 md:py-16">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo Lembaga" className="h-10 w-auto" />
            <span className="sr-only">Lembaga</span>
          </div>

          {/* Language switcher - native select for zero dependency */}
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="hidden sm:inline">Bahasa</span>
            <select
              className="rounded-xl border bg-white/70 px-3 py-2 text-sm shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              value={lang}
              onChange={(e) => switchLang(e.target.value)}
            >
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </select>
          </label>
        </header>

        {/* Hero */}
        <section className="mt-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-800 md:text-5xl">
            Bantu kami jadi lebih baik ❄️
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 md:text-lg">
            Isi survei ±60 detik. Jawaban anonim — datamu aman.
          </p>

          <FrostCard className="mx-auto mt-6 max-w-xl">
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              {/* Prefer SPA navigation via Inertia Link */}
              <FrostButton asChild className="w-full sm:w-auto">
                <Link href={startHref}>
                  Mulai Survei
                  <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              </FrostButton>

              <div className="w-full sm:w-auto">
                <div className="text-xs text-slate-500 sm:text-sm">Atau pilih survei di bawah</div>
              </div>
            </div>
          </FrostCard>

          {/* Trust & privacy */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 md:text-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
              <path d="M12 3l8 4v5c0 5-3.4 9.4-8 9.9C7.4 21.4 4 17 4 12V7l8-4z" className="stroke-current" strokeWidth="1.2" />
              <path d="M8.5 12l2 2 5-5" className="stroke-current" strokeWidth="1.2" />
            </svg>
            Data dienkripsi & hanya untuk analitik layanan
          </div>
        </section>

        {/* Search & count */}
        <section className="mt-12">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Daftar Survei</h2>
              <p className="mt-1 text-sm text-slate-500">
                {surveys?.length ? (
                  <>
                    {filtered.length} dari {surveys.length} tersedia
                  </>
                ) : (
                  <>Tidak ada survei saat ini</>
                )}
              </p>
            </div>

            <div className="w-full sm:w-80">
              <label className="block text-sm text-slate-600">
                <span className="sr-only">Cari survei</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari judul atau slug…"
                  className={
                    "w-full rounded-2xl border bg-white/70 px-4 py-2 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  }
                />
              </label>
            </div>
          </div>

          {/* List */}
          {filtered?.length ? (
            <div className="mt-5 grid grid-cols-1 gap-3">
              {filtered.map((s) => (
                <Link
                  key={s.id}
                  href={routeOr("run.show", s.slug, `/s/${s.slug}`)}
                  className={cn(
                    "group block rounded-2xl border bg-white/70 p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-medium text-slate-800">{s.title}</div>
                      <div className="truncate text-xs text-slate-500">/s/{s.slug}</div>
                    </div>
                    <span className="shrink-0 text-sm text-sky-700 transition-transform group-hover:translate-x-0.5">
                      Mulai →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <FrostCard className="mt-5 text-center text-slate-600">
              Belum ada survei yang tersedia.
            </FrostCard>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} — Terima kasih sudah membantu kami.
        </footer>
      </div>
    </div>
  );
}
