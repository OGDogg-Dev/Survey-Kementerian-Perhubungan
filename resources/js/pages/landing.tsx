import { Head } from '@inertiajs/react';
import { routeOr } from '@/lib/route';

export default function Landing({ surveys }: { surveys: { id: number; title: string; slug: string }[] }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <Head title="Survei" />
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-8 text-center text-3xl font-bold">Pilih Survei Anda</h1>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {surveys.map(survey => (
            <a
              key={survey.id}
              href={routeOr('run.show', survey.slug, `/s/${survey.slug}`)}
              className="rounded-xl bg-white/10 p-6 backdrop-blur transition hover:bg-white/20 hover:shadow-[0_0_10px_#9333ea]"
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
