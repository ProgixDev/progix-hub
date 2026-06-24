import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input">;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "border-line-1 bg-bg-inset flex h-10 w-full rounded-full border px-4 py-1 text-sm transition-colors outline-none",
        "placeholder:text-text-3",
        "focus:border-line-blue focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}
