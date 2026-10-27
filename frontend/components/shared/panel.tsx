import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0 gap-5 rounded-2xl border-border/70 shadow-none [--card-spacing:1.25rem] sm:[--card-spacing:1.5rem]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          <h2>{title}</h2>
        </CardTitle>
        {description ? (
          <CardDescription className="leading-6">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
