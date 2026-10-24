import { Plus } from "lucide-react";

import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

export function EmptyState({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return <Empty className="gap-4 rounded-2xl border border-dashed border-border/80 bg-card/50 px-5 py-8 sm:p-8"><EmptyHeader><EmptyMedia variant="icon" className="size-10 rounded-xl"><Plus /></EmptyMedia><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{description}</EmptyDescription></EmptyHeader>{children}</Empty>;
}
