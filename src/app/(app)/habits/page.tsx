import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Repeat } from "lucide-react";

export default function HabitsPage() {
  return (
    <>
      <PageHeader title="Habits" description="Build consistency day by day." />
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Repeat aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Habits coming soon</EmptyTitle>
          <EmptyDescription>
            Scaffolded in Phase 2 (Application Shell). Functionality lands in Phase 13.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
