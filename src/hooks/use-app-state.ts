"use client";

import { useSyncExternalStore } from "react";
import { appStore } from "@/services/app-store";

/** Binds React components to the app external store (client only). */
export function useAppState() {
  return useSyncExternalStore(
    appStore.subscribe,
    appStore.getState,
    appStore.getServerSnapshot
  );
}
