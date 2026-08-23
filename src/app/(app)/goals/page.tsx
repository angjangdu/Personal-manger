import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Target } from "lucide-react";

export default function GoalsPage() {
  return (
    <>
      <PageHeader title="Goals" description="Connect long-term outcomes to daily work." />
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Target aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Goals coming soon</EmptyTitle>
          <EmptyDescription>
            Scaffolded in Phase 2 (Application Shell). Functionality lands in Phase 7.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
