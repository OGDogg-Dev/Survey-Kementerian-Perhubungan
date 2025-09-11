import { TooltipProvider } from "@/components/ui/tooltip";
import type { PropsWithChildren } from "react";

export default function AppProviders({ children }: PropsWithChildren) {
  return <TooltipProvider delayDuration={150}>{children}</TooltipProvider>;
}
