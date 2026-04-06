"use client";

import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";

const NAV_ORDER = ["/", "/planning", "/menu", "/recettes", "/liste", "/courses", "/inventaire", "/suivi", "/preferences"];

function getNavIndex(path: string): number {
  const idx = NAV_ORDER.findIndex((p) => p === path || (p !== "/" && path.startsWith(p)));
  return idx >= 0 ? idx : 0;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [animClass, setAnimClass] = useState("");

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      const prevIdx = getNavIndex(prevPathRef.current);
      const nextIdx = getNavIndex(pathname);
      const dir = nextIdx > prevIdx ? "slide-left" : "slide-right";
      setAnimClass(dir);
      prevPathRef.current = pathname;

      // Remove animation class after it plays
      const timer = setTimeout(() => setAnimClass(""), 300);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <div className={`page-transition ${animClass}`}>
      {children}
    </div>
  );
}
