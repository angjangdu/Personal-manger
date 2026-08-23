import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" description="Progress and productivity metrics." />
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BarChart3 aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Analytics coming soon</EmptyTitle>
          <EmptyDescription>
            Scaffolded in Phase 2 (Application Shell). Functionality lands in Phase 16.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
