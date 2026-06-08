"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-bg flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div>
        <h1 className="text-text text-[18px] font-semibold">Something went wrong</h1>
        <p className="text-text-2 mt-1 text-[13.5px]">
          An unexpected error occurred. Try again, or reload the page.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="bg-blue text-primary-foreground hover:bg-blue-hover h-9 rounded-md px-4 text-[13.5px] font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
