import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Activity } from "lucide-react";

export default function ActivitiesPage() {
  return (
    <>
      <PageHeader title="Activities" description="Start, pause, and track focused work." />
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Activity aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Activities coming soon</EmptyTitle>
          <EmptyDescription>
            Scaffolded in Phase 2 (Application Shell). Functionality lands in Phase 10.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
