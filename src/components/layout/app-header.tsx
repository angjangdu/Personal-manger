"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { allNav } from "@/components/layout/nav-config";
import { GlobalSearchDialog } from "@/components/search/global-search-dialog";
import { NotificationBell } from "@/components/layout/notification-bell";

export function AppHeader() {
  const pathname = usePathname();
  const current = allNav.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="!h-5" />
      <span className="text-sm font-medium">{current?.title ?? "Personal OS"}</span>
      <div className="ml-auto flex items-center gap-2">
        <GlobalSearchDialog />
        <NotificationBell />
      </div>
    </header>
  );
}
