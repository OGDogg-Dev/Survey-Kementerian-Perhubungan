import { Link, Head } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import { routeOr } from "@/lib/route";

export default function Dashboard() {
  const surveysIndex = routeOr("surveys.index", undefined, "/surveys");
  return (
    <AdminLayout>
      <Head title="Dashboard" />
      <div className="mb-4 flex justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link
          href={surveysIndex}
          className="neon-hover rounded bg-indigo-600 px-3 py-2 text-white"
        >
          Manage Surveys
        </Link>
      </div>
      <div className="glass neon-hover rounded p-4">
        <p>
          Welcome to the Survey Dashboard. Use the button above to manage
          surveys and view responses.
        </p>
      </div>
    </AdminLayout>
  );
}
