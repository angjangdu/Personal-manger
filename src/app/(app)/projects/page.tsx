import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FolderKanban } from "lucide-react";

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projects" description="Group tasks into meaningful outcomes." />
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderKanban aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Projects coming soon</EmptyTitle>
          <EmptyDescription>
            Scaffolded in Phase 2 (Application Shell). Functionality lands in Phase 6.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
