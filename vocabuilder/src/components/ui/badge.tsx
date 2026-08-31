import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const styles = {
      default: "bg-[var(--primary)] text-[var(--primary-foreground)]",
      secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
      outline: "border border-[var(--border)] text-[var(--foreground)]",
      destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)]",
    } as const;

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", styles[variant], className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
