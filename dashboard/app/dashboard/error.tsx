'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center max-w-md p-8 bg-card rounded-xl shadow-sm border space-y-3">
        <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center">
          <span className="text-3xl">⚠</span>
        </div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground break-all">{error.message}</p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
