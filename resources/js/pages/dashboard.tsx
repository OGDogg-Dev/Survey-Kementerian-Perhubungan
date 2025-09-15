import { Head } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import FrostCard from "@/components/FrostCard";
import type { BreadcrumbItem } from "@/types";

export default function Dashboard() {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
  ];

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="min-h-screen bg-snow p-6 -mx-6 -my-2 sm:mx-0 sm:my-0 sm:rounded-xl">
        <div className="max-w-6xl mx-auto grid gap-6">
          <div className="grid md:grid-cols-3 gap-4">
            <FrostCard>
              <h3 className="text-slate-600">IKM Total</h3>
              <div className="text-3xl font-semibold">86</div>
              <div className="text-sm text-emerald-600">↑ 2</div>
            </FrostCard>
            <FrostCard>
              <h3 className="text-slate-600">Respon Minggu Ini</h3>
              <div className="text-3xl font-semibold">1.240</div>
            </FrostCard>
            <FrostCard>
              <h3 className="text-slate-600">NPS</h3>
              <div className="text-3xl font-semibold">+45</div>
            </FrostCard>
          </div>

          <FrostCard className="h-64 grid place-items-center text-slate-500">[ Chart Trend 30 Hari ]</FrostCard>
          <FrostCard className="h-64 grid place-items-center text-slate-500">[ Heatmap Jam x Hari ]</FrostCard>

          <FrostCard>
            <h3 className="text-slate-700 font-medium mb-3">Per Layanan</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-left p-2">Layanan</th>
                    <th className="text-left p-2">IKM</th>
                    <th className="text-left p-2">Respon</th>
                    <th className="text-left p-2">Terbawah</th>
                    <th className="text-left p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Loket 1', ikm: 84, rsp: 320, low: 'Kecepatan' },
                    { name: 'Informasi', ikm: 88, rsp: 410, low: 'Kejelasan' },
                    { name: 'Pengaduan', ikm: 76, rsp: 120, low: 'Empati' },
                  ].map((r) => (
                    <tr key={r.name} className="border-t">
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.ikm}</td>
                      <td className="p-2">{r.rsp}</td>
                      <td className="p-2">{r.low}</td>
                      <td className="p-2 text-glacier">Detail →</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FrostCard>
        </div>
      </div>
    </AdminLayout>
  );
}
