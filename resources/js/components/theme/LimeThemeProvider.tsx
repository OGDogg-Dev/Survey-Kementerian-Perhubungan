import type { PropsWithChildren } from "react";
import { useEffect } from "react";

export default function LimeThemeProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add("theme-lime");
    return () => {
      el.classList.remove("theme-lime");
    };
  }, []);
  return <>{children}</>;
}
