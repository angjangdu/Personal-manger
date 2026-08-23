import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Notebook } from "lucide-react";

export default function NotesPage() {
  return (
    <>
      <PageHeader title="Notes" description="Linked notes across your workspace." />
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Notebook aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Notes coming soon</EmptyTitle>
          <EmptyDescription>
            Scaffolded in Phase 2 (Application Shell). Functionality lands in Phase 15.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
