import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  maxValue?: number;
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({
  value,
  maxValue = 100,
  label,
  showValue = true,
  className,
  ...props
}: ProgressBarProps) {
  const progressValue = (value / maxValue) * 100;

  return (
    <div className={cn("w-full", className)} {...props}>
      {label && <p className="text-sm font-medium mb-1">{label}</p>}
      <div className="flex items-center space-x-2">
        <Progress value={progressValue} className="flex-grow" />
        {showValue && (
          <span className="text-sm text-muted-foreground">
            {`${Math.round(progressValue)}%`}
          </span>
        )}
      </div>
    </div>
  );
}