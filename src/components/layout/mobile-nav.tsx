"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { mobileNav, secondaryNav } from "@/components/layout/nav-config";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      aria-label="Primary"
      className="bg-background fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-5">
        {mobileNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 py-2 text-xs ${
              isActive(item.href)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="size-5" aria-hidden />
            {item.title.replace(/s$/, "")}
          </Link>
        ))}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground flex flex-col items-center justify-center gap-1 py-2 text-xs"
            >
              <MoreHorizontal className="size-5" aria-hidden />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="top" className="rounded-b-none">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
              <SheetDescription>Remaining sections</SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-2 px-4 pb-6">
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.href} className="list-none">
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    onClick={() => setOpen(false)}
                    className="h-auto flex-col gap-1 py-3"
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" aria-hidden />
                      <span className="text-xs">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
