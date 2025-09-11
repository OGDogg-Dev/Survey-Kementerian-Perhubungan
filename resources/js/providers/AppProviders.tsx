import { TooltipProvider } from "@/components/ui/tooltip";
import LimeThemeProvider from "@/components/theme/LimeThemeProvider";
import type { PropsWithChildren } from "react";

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <TooltipProvider delayDuration={150}>
      <LimeThemeProvider>{children}</LimeThemeProvider>
    </TooltipProvider>
  );
}
