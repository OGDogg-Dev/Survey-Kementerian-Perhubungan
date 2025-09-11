import { Head } from '@inertiajs/react';
import { routeOr } from '@/lib/route';

export default function Landing({ surveys }: { surveys: { id: number; title: string; slug: string }[] }) {
  return (
    <div className="animate-gradient min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <Head title="Survei" />
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight">Selamat Datang</h1>
        <p className="mb-12 text-lg text-purple-200">Pilih salah satu survei di bawah ini untuk memulai</p>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map(survey => (
            <a
              key={survey.id}
              href={routeOr('run.show', survey.slug, `/s/${survey.slug}`)}
              className="glass neon-hover rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold">{survey.title}</h2>
              <p className="mt-2 text-sm opacity-75">Klik untuk memulai</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
