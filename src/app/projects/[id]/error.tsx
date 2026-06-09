"use client";

export default function ProjectError({ reset }: { reset: () => void }) {
  return (
    <div className="bg-bg flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-text text-[15px] font-semibold">
        Something went wrong loading this project.
      </p>
      <button
        type="button"
        onClick={reset}
        className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-9 rounded-md border px-3 text-[13px] font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
