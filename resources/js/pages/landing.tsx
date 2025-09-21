import { Head, Link, usePage } from "@inertiajs/react";
import * as React from "react";
import FrostButton from "@/components/FrostButton";
import FrostCard from "@/components/FrostCard";
import { routeOr } from "@/lib/route";
import { ArrowRight, Clock, Mail, ShieldCheck } from "lucide-react";

type SurveyLite = { id: number; title: string; slug: string };

function useFilteredSurveys<T extends SurveyLite>(surveys: T[] | undefined, query: string) {
  const cleaned = query.trim().toLowerCase();
  return React.useMemo(() => {
    if (!surveys?.length) return [] as T[];
    if (!cleaned) return surveys;
    return surveys.filter((s) => [s.title, s.slug].some((value) => value?.toLowerCase().includes(cleaned)));
  }, [surveys, cleaned]);
}

export default function LandingPage() {
  const { surveys } = usePage<{ surveys?: SurveyLite[] }>().props;
  const primarySurvey = surveys?.[0];
  const [search, setSearch] = React.useState("");

  const heroHref = primarySurvey
    ? routeOr("run.show", primarySurvey.slug, `/s/${primarySurvey.slug}`)
    : routeOr("surveys.index", undefined, "/surveys");
  const loginHref = routeOr("login", undefined, "/login");
  const filtered = useFilteredSurveys(surveys, search);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <Head title="Survei Kepuasan Terminal" />

      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3">
            <Link href={routeOr("home", undefined, "/")} className="flex items-center gap-3">
              <img src="/logo.svg" alt="Logo Kemenhub" className="h-10 w-auto" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 md:hidden">
                Survei Terminal Kemenhub
              </span>
            </Link>
            <div className="hidden justify-self-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 md:block">
              Sistem Survei Terminal Nasional
            </div>
            <div className="justify-self-end">
              <FrostButton asChild variant="secondary" className="h-10 rounded-full px-4 text-sm font-medium">
                <Link href={loginHref}>Login Admin</Link>
              </FrostButton>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[-12rem] flex justify-center">
            <div className="h-72 w-72 rounded-full bg-sky-200/40 blur-3xl md:h-[22rem] md:w-[22rem]" />
          </div>
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-12 md:gap-16 md:pb-24 md:pt-20">
            <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-center">
              <div className="flex flex-col gap-6 text-center md:text-left">
                <div className="flex flex-col items-center gap-2 md:items-start">
                  <span className="rounded-full bg-sky-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
                    Program Pelayanan Publik Kemenhub
                  </span>
                  <h1 className="text-balance text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                    Survei Kepuasan Terminal
                  </h1>
                  <p className="max-w-xl text-base text-slate-600 md:text-lg">
                    Sampaikan pengalaman Anda menggunakan terminal dan layanan transportasi. Suara Anda membantu kami
                    meningkatkan kenyamanan, ketepatan, dan keamanan perjalanan.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 md:flex-row md:items-center">
                  <FrostButton asChild className="w-full rounded-full px-6 text-base font-semibold md:w-auto md:text-lg">
                    <Link href={heroHref}>
                      Mulai Survei
                      <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                    </Link>
                  </FrostButton>
                  <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm">
                    <Clock className="h-4 w-4" aria-hidden />
                    Estimasi waktu ~5 menit
                  </div>
                </div>
              </div>

              <FrostCard className="relative overflow-hidden p-8">
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-200/40 blur-3xl" aria-hidden />
                <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden />
                <div className="relative flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Mengapa penting?</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Hasil survei menjadi dasar perbaikan fasilitas terminal, kebersihan, petugas layanan, sampai integrasi
                      antarmoda.
                    </p>
                  </div>
                  <ul className="flex flex-col gap-4 text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="mt-1 h-5 w-5 text-emerald-500" aria-hidden />
                      Informasi Anda terlindungi sesuai kebijakan privasi Kemenhub.
                    </li>
                    <li className="flex items-start gap-3">
                      <ArrowRight className="mt-1 h-5 w-5 text-sky-500" aria-hidden />
                      Rekomendasi langsung diteruskan ke unit terkait untuk ditindaklanjuti.
                    </li>
                    <li className="flex items-start gap-3">
                      <Clock className="mt-1 h-5 w-5 text-amber-500" aria-hidden />
                      Jawabannya ringkas dan bisa dihentikan sementara lalu dilanjutkan.
                    </li>
                  </ul>
                </div>
              </FrostCard>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Daftar Survei Aktif</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {surveys?.length ? (
                      <>
                        {filtered.length} dari {surveys.length} survei dapat diikuti saat ini.
                      </>
                    ) : (
                      <>Belum ada survei yang dipublikasikan.</>
                    )}
                  </p>
                </div>
                {surveys?.length ? (
                  <label className="relative w-full sm:w-72">
                    <span className="sr-only">Cari survei</span>
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Cari judul atau lokasi"
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </label>
                ) : null}
              </div>

              {filtered?.length ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {filtered.map((survey) => (
                    <Link
                      key={survey.id}
                      href={routeOr("run.show", survey.slug, `/s/${survey.slug}`)}
                      className="group flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-sky-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                    >
                      <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">Survei Publik</div>
                      <div className="mt-3 text-lg font-semibold text-slate-800">{survey.title}</div>
                      <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                        <span>/s/{survey.slug}</span>
                        <span className="inline-flex items-center gap-1 text-sky-600">
                          Mulai
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
                  Kami akan mengumumkan survei berikutnya segera. Nantikan informasi terbaru.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/60 bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-semibold text-slate-700">Kementerian Perhubungan Republik Indonesia</div>
            <p className="mt-1 max-w-xl text-slate-500">
              Kami berkomitmen menjaga kerahasiaan data responden dan hanya menggunakan jawaban untuk analitik peningkatan
              pelayanan terminal.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:text-right">
            <a href="mailto:survei@dephub.go.id" className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-600">
              <Mail className="h-4 w-4" aria-hidden /> survei@dephub.go.id
            </a>
            <p>Jl. Medan Merdeka Barat No. 8, Jakarta Pusat</p>
            <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Direktorat Jenderal Perhubungan Darat</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
