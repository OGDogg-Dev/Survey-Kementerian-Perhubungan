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
    <div className="landing-wrap relative min-h-screen overflow-hidden text-foreground">
      <Head title="Survei Kementerian Perhubungan - Partisipasi Publik & Kepuasan Layanan" />

      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-wide sm:text-lg">Survey Kemenhub</span>
          <Badge variant="secondary" className="hidden sm:inline-flex">Beta</Badge>
        </div>
        {auth?.user ? (
          <Button asChild variant="secondary">
            <Link href={routeOr("dashboard", undefined, "/dashboard")} className="inline-flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link href={routeOr("login", undefined, "/login")} className="inline-flex items-center gap-2">
              <LogIn className="h-4 w-4" /> Masuk
            </Link>
          </Button>
        )}
      </header>

      <main className="pb-12">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 py-6 text-center">
          <h1 className="heading-hero mx-auto max-w-3xl">
            Partisipasi Anda <span className="landing-hero-accent">mendorong</span> layanan lebih baik
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-foreground/80 sm:text-lg">
            Pilih survei yang tersedia dan sampaikan masukan Anda. Ringan, aman, dan responsif di semua perangkat.
          </p>

          {/* CTA group */}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild>
              <a href={firstHref} className="inline-flex items-center gap-2">
                Mulai survei <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="#surveys" className="inline-flex items-center gap-2">
                Lihat Daftar
              </a>
            </Button>
          </div>

          {/* Quick stats */}
          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-2 text-xs text-foreground/80 sm:text-sm">
            <div className="rounded-lg border border-border/50 bg-background/40 p-2">
              <div className="font-semibold text-foreground">{surveys.length}</div>
              <div>survei aktif</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/40 p-2">
              <div className="font-semibold text-foreground">Cepat</div>
              <div>3-5 menit</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/40 p-2">
              <div className="font-semibold text-foreground">Aman</div>
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
                className="w-full rounded-xl border-border/50 bg-background/40 pl-10 text-foreground placeholder:text-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cari survei"
              />
              <span className={`pointer-events-none absolute right-3 top-2.5 hidden select-none rounded-md border border-border/50 bg-background/40 px-1.5 py-0.5 text-[10px] text-foreground/80 sm:inline-block ${focused ? "opacity-0" : "opacity-100"}`} aria-hidden>
                /
              </span>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">{filtered.length} hasil</Badge>
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
                  className="group relative rounded-2xl p-5 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring card-accent"
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary/70 via-accent/70 to-primary/70 opacity-70" />
                  <h2 className="line-clamp-2 pr-8 text-left text-lg font-semibold tracking-tight">{survey.title}</h2>
                  <p className="mt-1 text-left text-sm text-foreground/70">/{survey.slug}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm landing-hero-accent transition group-hover:translate-x-0.5">
                    Mulai <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/50 bg-background/40 p-10 text-center">
              <p className="text-sm text-foreground/80">Tidak ada survei yang cocok.</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button variant="secondary" onClick={() => setQ("")}>Reset</Button>
                {auth?.user ? (
                  <Button asChild>
                    <Link href={routeOr("surveys.create", undefined, "/surveys/create")} className="inline-flex items-center gap-2">
                      Buat Survei
                    </Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href={routeOr("login", undefined, "/login")} className="inline-flex items-center gap-2">
                      Masuk untuk Membuat
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-6 pb-10">
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-6 text-sm text-foreground/70 sm:flex-row">
          <p>c {new Date().getFullYear()} Kementerian Perhubungan - Semua hak dilindungi</p>
          <div className="flex items-center gap-4">
            {auth?.user ? (
              <Link href={routeOr("dashboard", undefined, "/dashboard")} className="inline-flex items-center gap-1 hover:text-foreground">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            ) : (
              <Link href={routeOr("login", undefined, "/login")} className="inline-flex items-center gap-1 hover:text-foreground">
                <LogIn className="h-4 w-4" /> Masuk
              </Link>
            )}
            <a href="#surveys" className="hover:text-foreground">Daftar Survei</a>
          </div>
        </div>
      </footer>
    </div>
  );
}





