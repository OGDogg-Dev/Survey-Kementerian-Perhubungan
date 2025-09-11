import type { PropsWithChildren } from "react";
import AppHeaderLayout from "@/layouts/app/app-header-layout";
import type { BreadcrumbItem } from "@/types";

// AdminLayout now reuses the main App layout (header + sidebar)
// so all admin pages get a consistent shell, theming, and responsive UX.
export default function AdminLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
  return <AppHeaderLayout breadcrumbs={breadcrumbs}>{children}</AppHeaderLayout>;
}
