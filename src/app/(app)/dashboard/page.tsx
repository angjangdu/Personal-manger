import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Today's priorities at a glance." />
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LayoutDashboard aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Dashboard coming soon</EmptyTitle>
          <EmptyDescription>
            Scaffolded in Phase 2 (Application Shell). Functionality lands in Phase 3.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
