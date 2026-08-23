"use client";

import { useEffect, useState } from "react";

/**
 * Live wall-clock hook. Reading the clock during render is inherently impure,
 * so this hook is the single sanctioned place it happens: the initial read is
 * explicit, then updates flow through the interval subscription.
 */
export function useNow(refreshMs: number = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  return now;
}
