import type { ActivityCategory } from "@/types";

export const ACTIVITY_CATEGORIES: { value: ActivityCategory; label: string }[] = [
  { value: "study", label: "Study" },
  { value: "coding", label: "Coding" },
  { value: "college", label: "College" },
  { value: "project", label: "Project" },
  { value: "work", label: "Work" },
  { value: "exercise", label: "Exercise" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

export function categoryLabel(category?: ActivityCategory): string {
  return ACTIVITY_CATEGORIES.find((c) => c.value === category)?.label ?? "";
}
