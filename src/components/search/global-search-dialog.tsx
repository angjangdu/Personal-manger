"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { globalSearch, type SearchResult } from "@/lib/search-utils";
import { cn } from "@/lib/utils";

const KIND_BADGE: Record<SearchResult["kind"], string> = {
  Task: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Event: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Project: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Goal: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  Note: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  Subject: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  Topic: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  Habit: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
};

/** ⌘K / Ctrl+K command palette searching across everything (review §17). */
export function GlobalSearchDialog() {
  const state = useAppState();
  const router = useRouter();
  const nowMs = useNow(60000);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Render-time adjustment (sanctioned derived-state pattern): reset
  // selection whenever the query changes.
  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setActive(0);
  }

  // React Compiler auto-memoizes from its inputs.
  const results = open ? globalSearch(state, query, nowMs) : [];

  function go(result: SearchResult) {
    setOpen(false);
    router.push(result.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search everything"
        className="text-muted-foreground hover:bg-accent hover:text-foreground ml-auto inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs transition-colors"
      >
        <Search className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">Search</span>
        <kbd className="bg-muted hidden rounded border px-1 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[15%] translate-y-0 p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Global search</DialogTitle>
          <div className="border-b">
            <div className="relative">
              <Search
                className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search tasks, events, projects, notes…"
                className="rounded-b-none border-0 focus-visible:ring-0"
                aria-label="Search query"
              />
            </div>
          </div>

          <ul className="max-h-[50vh] overflow-y-auto p-1.5">
            {results.map((result, i) => (
              <li key={result.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(result)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left",
                    i === active ? "bg-accent" : ""
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                      KIND_BADGE[result.kind]
                    )}
                  >
                    {result.kind}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{result.title}</span>
                    {result.subtitle && (
                      <span className="text-muted-foreground block truncate text-[11px]">
                        {result.subtitle}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
            {query.trim() && results.length === 0 && (
              <li className="text-muted-foreground px-3 py-6 text-center text-sm">
                No matches for “{query}”.
              </li>
            )}
            {!query.trim() && (
              <li className="text-muted-foreground px-3 py-6 text-center text-sm">
                Type to search across your whole workspace.
              </li>
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
