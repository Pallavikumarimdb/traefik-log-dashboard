export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Loading dashboard…</p>
      </div>
    </div>
  );
}
