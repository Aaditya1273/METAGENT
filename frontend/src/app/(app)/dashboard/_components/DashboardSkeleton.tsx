'use client';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-9 w-64 bg-emerald-100/50 rounded-xl animate-pulse" />
          <div className="h-4 w-40 bg-emerald-50/50 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-emerald-100/50 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white/50 border border-emerald-100/30 rounded-[1.5rem] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-white/50 border border-emerald-100/30 rounded-[1.5rem] animate-pulse" />
        <div className="h-80 bg-white/50 border border-emerald-100/30 rounded-[1.5rem] animate-pulse" />
      </div>
    </div>
  );
}
