import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ListTodo } from "lucide-react";

export default function TasksPage() {
  return (
    <>
      <PageHeader title="Tasks" description="Capture and organize everything you need to do." />
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListTodo aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Tasks coming soon</EmptyTitle>
          <EmptyDescription>
            Scaffolded in Phase 2 (Application Shell). Functionality lands in Phase 4.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
