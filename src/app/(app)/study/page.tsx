import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BookOpen } from "lucide-react";

export default function StudyPage() {
  return (
    <>
      <PageHeader title="Study" description="Courses, topics, sessions, and revisions." />
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookOpen aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Study coming soon</EmptyTitle>
          <EmptyDescription>
            Scaffolded in Phase 2 (Application Shell). Functionality lands in Phase 14.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
