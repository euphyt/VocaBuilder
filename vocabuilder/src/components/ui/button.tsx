// src/components/ui/button.tsx
import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "default" | "outline" | "ghost" | "secondary" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

    const variants: Record<Variant, string> = {
      default:
        "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
      outline:
        "border border-[var(--border)] bg-white text-foreground hover:bg-[var(--accent)]",
      ghost: "bg-transparent hover:bg-[var(--accent)]",
      secondary:
        "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
      destructive:
        "bg-[var(--destructive)] text-[var(--destructive-foreground)]",
    };

    const sizes: Record<Size, string> = {
      sm: "px-3 py-2 text-sm",
      md: "px-5 py-3 text-base",
      lg: "px-6 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
