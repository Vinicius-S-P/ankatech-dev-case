import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  metric: string;
  description?: string;
}

export function MetricCard({
  title,
  metric,
  description,
  className,
  ...props
}: MetricCardProps) {
  return (
    <Card className={cn("flex flex-col", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end">
        <div className="text-2xl font-bold">{metric}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}