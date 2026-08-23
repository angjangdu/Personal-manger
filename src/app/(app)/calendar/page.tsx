import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendar" description="Day, week, and month schedule views." />
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDays aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Calendar coming soon</EmptyTitle>
          <EmptyDescription>
            Scaffolded in Phase 2 (Application Shell). Functionality lands in Phase 8.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
