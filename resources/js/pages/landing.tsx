import { Head, Link, usePage } from '@inertiajs/react';
import { routeOr } from '@/lib/route';
import type { SharedData } from '@/types';

export default function Landing({ surveys }: { surveys: { id: number; title: string; slug: string }[] }) {
  const { auth } = usePage<SharedData>().props;
  return (
    <div className="animate-gradient min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <Head title="Survei" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold">Survey Kemenhub</span>
        {auth?.user ? (
          <Link href={routeOr('dashboard', undefined, '/dashboard')} className="underline underline-offset-4">
            Dashboard
          </Link>
        ) : (
          <Link href={routeOr('login', undefined, '/login')} className="underline underline-offset-4">
            Masuk
          </Link>
        )}
      </header>
      <div className="mx-auto max-w-6xl px-6 py-12 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight">Selamat Datang</h1>
        <p className="mb-12 text-lg text-purple-200">Pilih salah satu survei di bawah ini untuk memulai</p>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => (
            <a
              key={survey.id}
              href={routeOr('run.show', survey.slug, `/s/${survey.slug}`)}
              className="glass neon-hover rounded-xl p-6"
              aria-label={`Buka survei ${survey.title}`}
            >
              <h2 className="text-left text-xl font-semibold">{survey.title}</h2>
              <p className="mt-2 text-left text-sm opacity-75">Klik untuk memulai</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
