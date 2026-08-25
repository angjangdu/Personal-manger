"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Download, BedDouble, Moon, RotateCcw, Smartphone, Sun } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { appStore, STORAGE_KEY } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const state = useAppState();
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      installPromptRef.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function install() {
    const prompt = installPromptRef.current;
    if (!prompt) return;
    void prompt.prompt().then(() => prompt.userChoice).then((choice) => {
      if (choice.outcome === "accepted") {
        setCanInstall(false);
        toast("Personal OS installed");
      }
      installPromptRef.current = null;
    });
  }

  function exportData() {
    const data = JSON.stringify(appStore.getState(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personal-os-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Data exported", { description: "A JSON snapshot of everything was downloaded." });
  }

  function resetData() {
    const confirmed = window.confirm(
      "Reset all data to the demo seed? Everything you created will be permanently removed. Export first if you want a copy."
    );
    if (!confirmed) return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  return (
    <>
      <PageHeader title="Settings" description="Appearance, install, and your local data.">
        {canInstall && (
          <Button variant="outline" onClick={install}>
            <Smartphone aria-hidden /> Install app
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>
              Theme applies instantly and follows your system by default.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* suppressHydrationWarning: theme is only known on the client */}
            <div className="flex items-center justify-between gap-3" suppressHydrationWarning>
              <div className="flex min-w-0 items-center gap-2 text-sm">
                {theme === "dark" ? (
                  <Moon className="size-4 shrink-0" aria-hidden />
                ) : (
                  <Sun className="size-4 shrink-0" aria-hidden />
                )}
                Theme
                <span className="text-muted-foreground text-xs capitalize">
                  ({theme ?? "system"})
                </span>
              </div>
              <Select value={theme ?? "system"} onValueChange={setTheme}>
                <SelectTrigger className="w-[130px]" aria-label="Theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <p className="text-sm font-medium">Sleep schedule</p>
              <p className="text-muted-foreground text-xs">
                Free-time calculations exclude your sleep hours (review §4).
              </p>
              <div className="flex flex-wrap items-center gap-3" suppressHydrationWarning>
                <BedDouble className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <label className="flex items-center gap-2 text-sm">
                  Sleep at
                  <Input
                    type="time"
                    value={state.settings.sleepStart}
                    onChange={(e) => appStore.updateSettings({ sleepStart: e.target.value })}
                    className="w-[110px]"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  Wake at
                  <Input
                    type="time"
                    value={state.settings.sleepEnd}
                    onChange={(e) => appStore.updateSettings({ sleepEnd: e.target.value })}
                    className="w-[110px]"
                  />
                </label>
              </div>
            </div>

            <Separator className="my-4" />

            <p className="text-muted-foreground text-xs">
              More personalization arrives with later iterations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your data</CardTitle>
            <CardDescription>
              Synced to Supabase. Export a snapshot anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Export</p>
                <p className="text-muted-foreground text-xs">
                  Download a JSON snapshot of all tasks, projects, goals,
                  activities, study data, notes, and reviews.
                </p>
              </div>
              <Button variant="outline" onClick={exportData}>
                <Download aria-hidden /> Export JSON
              </Button>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-destructive text-sm font-medium">Reset demo data</p>
                <p className="text-muted-foreground text-xs">
                  Wipes this browser&apos;s data and restores the original demo seed.
                </p>
              </div>
              <Button variant="destructive" onClick={resetData}>
                <RotateCcw aria-hidden /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">Personal OS</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Plan → Schedule → Execute → Track → Review → Learn.
              Full documentation lives in{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-[11px]">docs/</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
