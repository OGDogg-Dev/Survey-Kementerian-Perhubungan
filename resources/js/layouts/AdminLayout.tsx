import { PropsWithChildren } from "react";
import { Link, usePage } from "@inertiajs/react";
import type { SharedData } from "@/types";
import { routeOr } from "@/lib/route";

export default function AdminLayout({ children }: PropsWithChildren) {
  const { auth } = usePage<SharedData>().props;
  const surveysIndex = routeOr("surveys.index", undefined, "/surveys");
  return (
    <div className="min-h-screen">
      <header className="glass mb-6">
        <div className="mx-auto max-w-6xl flex items-center gap-4 p-4">
          <Link href={surveysIndex} className="font-semibold">
            Survey Admin
          </Link>
          <nav className="ml-auto flex items-center gap-3">
            <span className="text-sm opacity-80">{auth?.user?.name}</span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
