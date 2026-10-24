import { DisplayHeading } from "@/components/typography/display-heading";

export function PageHeading({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return <header className="mb-6 flex min-w-0 flex-wrap items-start justify-between gap-4"><div className="min-w-0 max-w-2xl"><DisplayHeading>{title}</DisplayHeading>{description ? <p className="mt-2 text-sm text-pretty text-muted-foreground">{description}</p> : null}</div>{children ? <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{children}</div> : null}</header>;
}
