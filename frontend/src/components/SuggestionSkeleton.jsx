export default function SuggestionSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-slate-200" />
        <div className="h-4 w-2/3 rounded bg-slate-200" />
      </div>
      <div className="mb-2 h-3 w-full rounded bg-slate-200" />
      <div className="mb-4 h-3 w-5/6 rounded bg-slate-200" />
      <div className="flex justify-between">
        <div className="h-5 w-16 rounded-full bg-slate-200" />
        <div className="h-5 w-24 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}
