import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-[22px] w-fit max-w-full items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-line-1 bg-bg-2 text-text-1",
        green: "border-green/30 bg-green-tint text-[#8FE3BB]",
        amber: "border-amber/30 bg-amber-tint text-[#F3D38C]",
        red: "border-red/30 bg-red-tint text-[#FFB6A2]",
        blue: "border-line-blue bg-blue-tint text-blue-text",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

const dotTone: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-text-2",
  green: "bg-green shadow-[0_0_0_3px_var(--green-tint)]",
  amber: "bg-amber shadow-[0_0_0_3px_var(--amber-tint)]",
  red: "bg-red shadow-[0_0_0_3px_var(--red-tint)]",
  blue: "bg-blue shadow-[0_0_0_3px_var(--blue-tint)]",
};

/** A status badge with a leading dot, e.g. ● Active / ● At risk / ● Archived. */
export function StatusBadge({ tone = "neutral", children, className, ...props }: BadgeProps) {
  return (
    <Badge tone={tone} className={className} {...props}>
      <span className={cn("size-1.5 rounded-full", dotTone[tone ?? "neutral"])} />
      {children}
    </Badge>
  );
}
