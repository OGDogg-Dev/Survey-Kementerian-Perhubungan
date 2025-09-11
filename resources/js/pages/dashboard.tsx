import { Link, Head } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { routeOr } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BreadcrumbItem } from "@/types";

export default function Dashboard() {
  const surveysIndex = routeOr("surveys.index", undefined, "/surveys");
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: routeOr("dashboard", undefined, "/dashboard") },
  ];
  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Button asChild>
          <Link href={surveysIndex}>Kelola Survei</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Selamat datang di Dashboard Survei</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Akses cepat untuk membuat, mengedit, mempublikasikan, dan menganalisis survei.
          </p>
          <div>
            <Button asChild>
              <Link href={surveysIndex}>Lihat daftar survei</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
