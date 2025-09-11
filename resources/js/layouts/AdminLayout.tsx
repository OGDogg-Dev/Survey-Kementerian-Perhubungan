import type { PropsWithChildren } from "react";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";

// AdminLayout now reuses the main App layout (header + sidebar)
// so all admin pages get a consistent shell, theming, and responsive UX.
export default function AdminLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
  return <AppLayout breadcrumbs={breadcrumbs}>{children}</AppLayout>;
}
