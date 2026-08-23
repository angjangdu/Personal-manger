import {
  Activity,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarClock,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Notebook,
  Repeat,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const primaryNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Tasks", href: "/tasks", icon: ListTodo },
  { title: "Calendar", href: "/calendar", icon: Calendar },
  { title: "Activities", href: "/activities", icon: Activity },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Goals", href: "/goals", icon: Target },
];

export const secondaryNav: NavItem[] = [
  { title: "Planner", href: "/planner", icon: CalendarClock },
  { title: "Habits", href: "/habits", icon: Repeat },
  { title: "Study", href: "/study", icon: BookOpen },
  { title: "Notes", href: "/notes", icon: Notebook },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const allNav = [...primaryNav, ...secondaryNav];

/** Mobile bottom navigation per UI/UX spec: Home | Tasks | Calendar | Activity | More */
export const mobileNav: NavItem[] = [
  primaryNav[0],
  primaryNav[1],
  primaryNav[2],
  primaryNav[3],
];
