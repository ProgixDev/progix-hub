import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Design-system button (shadcn/ui-compatible). Variants live here; layout (margins,
 * width) belongs to the call site — docs/conventions/styling.md.
 */
const buttonVariants = cva(
  "focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // The signature action — blue gradient + glow (see .btn-primary in globals.css).
        default: "btn-primary",
        secondary: "border-line-1 bg-bg-2 text-text hover:bg-bg-3 hover:border-line-strong border",
        outline: "border-line-1 hover:bg-bg-2 hover:text-text text-text-1 border bg-transparent",
        ghost: "hover:bg-bg-2 hover:text-text text-text-1",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_8px_24px_-8px_rgba(240,97,59,0.5)] hover:brightness-110",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-11 px-6",
        icon: "size-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { buttonVariants };
