import * as React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { routeOr } from "@/lib/route";
import type { SharedData } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight, LayoutDashboard, LogIn } from "lucide-react";

type Survey = { id: number; title: string; slug: string };

export default function Landing({ surveys }: { surveys: Survey[] }) {
  const { auth } = usePage<SharedData>().props;
  const [q, setQ] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const filtered = React.useMemo(
    () => surveys.filter((s) => (`${s.title} ${s.slug}`).toLowerCase().includes(q.toLowerCase())),
    [surveys, q]
  );

  // Hotkey: "/" fokus ke search
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const el = document.getElementById("landing-search") as HTMLInputElement | null;
        el?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const firstHref = filtered[0]
    ? routeOr("run.show", filtered[0].slug, `/s/${filtered[0].slug}`)
    : surveys[0]
      ? routeOr("run.show", surveys[0].slug, `/s/${surveys[0].slug}`)
      : routeOr("login", undefined, "/login");

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <Head title="Survei Kementerian Perhubungan — Partisipasi Publik & Kepuasan Layanan" />

      {/* Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20" style={{
        background:
          "radial-gradient(1000px 600px at 10% 10%, rgba(124,58,237,.18), transparent 60%), radial-gradient(800px 400px at 90% 20%, rgba(59,130,246,.16), transparent 60%), linear-gradient(135deg, rgba(2,6,23,.92), rgba(3,7,18,.96))",
      }} />
      <div aria-hidden className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-wide sm:text-lg">Survey Kemenhub</span>
          <Badge variant="secondary" className="hidden bg-white/10 text-white sm:inline-flex">Beta</Badge>
        </div>
        {auth?.user ? (
          <Link href={routeOr("dashboard", undefined, "/dashboard")} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
        ) : (
          <Link href={routeOr("login", undefined, "/login")} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
            <LogIn className="h-4 w-4" /> Masuk
          </Link>
        )}
      </header>

      <main className="pb-12">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 py-6 text-center">
          <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
            Partisipasi Anda <span className="text-fuchsia-300">mendorong</span> layanan lebih baik
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-white/80 sm:text-lg">
            Pilih survei yang tersedia dan sampaikan masukan Anda. Ringan, aman, dan responsif di semua perangkat.
          </p>

          {/* CTA group */}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={firstHref} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-900 shadow/10 transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
              Mulai survei <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#surveys" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
              Lihat Daftar
            </a>
          </div>

          {/* Quick stats */}
          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-2 text-xs text-white/70 sm:text-sm">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="font-semibold text-white">{surveys.length}</div>
              <div>survei aktif</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="font-semibold text-white">Cepat</div>
              <div>± 3–5 menit</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="font-semibold text-white">Aman</div>
              <div>Data terjaga</div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="mx-auto max-w-7xl px-6">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 opacity-70" />
              <Input
                id="landing-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Cari judul atau slug survei (tekan /)"
                className="w-full rounded-xl border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/30"
                aria-label="Cari survei"
              />
              <span className={`pointer-events-none absolute right-3 top-2.5 hidden select-none rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80 sm:inline-block ${focused ? "opacity-0" : "opacity-100"}`} aria-hidden>
                /
              </span>
            </div>
            <Badge variant="secondary" className="hidden bg-white/10 text-white sm:inline-flex">{filtered.length} hasil</Badge>
          </div>
        </section>

        {/* Survey Grid */}
        <section id="surveys" className="mx-auto max-w-7xl px-6 py-10">
          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((survey) => (
                <Link
                  key={survey.id}
                  href={routeOr("run.show", survey.slug, `/s/${survey.slug}`)}
                  aria-label={`Buka survei ${survey.title}`}
                  className="group relative rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-fuchsia-400/70 via-indigo-400/70 to-fuchsia-400/70 opacity-70" />
                  <h2 className="line-clamp-2 pr-8 text-left text-lg font-semibold tracking-tight">{survey.title}</h2>
                  <p className="mt-1 text-left text-sm text-white/70">/{survey.slug}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-fuchsia-200 transition group-hover:translate-x-0.5">
                    Mulai <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center">
              <p className="text-sm text-white/80">Tidak ada survei yang cocok.</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => setQ("")}>
                  Reset
                </Button>
                {auth?.user ? (
                  <Link href={routeOr("surveys.create", undefined, "/surveys/create")} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:brightness-95">
                    Buat Survei
                  </Link>
                ) : (
                  <Link href={routeOr("login", undefined, "/login")} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:brightness-95">
                    Masuk untuk Membuat
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-6 pb-10">
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/70 sm:flex-row">
          <p>© {new Date().getFullYear()} Kementerian Perhubungan — Semua hak dilindungi</p>
          <div className="flex items-center gap-4">
            {auth?.user ? (
              <Link href={routeOr("dashboard", undefined, "/dashboard")} className="inline-flex items-center gap-1 hover:text-white">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            ) : (
              <Link href={routeOr("login", undefined, "/login")} className="inline-flex items-center gap-1 hover:text-white">
                <LogIn className="h-4 w-4" /> Masuk
              </Link>
            )}
            <a href="#surveys" className="hover:text-white">Daftar Survei</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

