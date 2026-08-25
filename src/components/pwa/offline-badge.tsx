"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Shows an offline pill in the header when the device loses connectivity. */
export function OfflineBadge() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <span
      className="flex items-center gap-1 rounded-full border border-yellow-500/50 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-700 dark:text-yellow-400"
      role="status"
    >
      <WifiOff className="size-3" aria-hidden /> Offline
    </span>
  );
}
