import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="App preferences and appearance." />
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Settings aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Settings coming soon</EmptyTitle>
          <EmptyDescription>
            Scaffolded in Phase 2 (Application Shell). Functionality lands in Phase 27.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
