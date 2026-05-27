export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />

        <p className="text-sm text-zinc-500">
          Loading workspace...
        </p>
      </div>
    </div>
  );
}