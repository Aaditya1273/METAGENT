'use client';

interface LiveIndicatorProps {
  connected: boolean;
  pulse?: boolean;
}

export default function LiveIndicator({ connected, pulse = true }: LiveIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm border transition-all ${
        connected
          ? 'bg-emerald-50/80 border-emerald-200/60 text-emerald-600'
          : 'bg-gray-50/80 border-gray-200/60 text-gray-500'
      }`}
    >
      <span className="relative flex w-2.5 h-2.5">
        <span
          className={`absolute inline-flex w-full h-full rounded-full opacity-75 ${
            connected && pulse ? 'animate-ping bg-emerald-400' : 'bg-gray-300'
          }`}
        />
        <span
          className={`relative inline-flex w-2.5 h-2.5 rounded-full ${
            connected ? 'bg-emerald-500' : 'bg-gray-400'
          }`}
        />
      </span>
      {connected ? 'Live' : 'Offline'}
    </div>
  );
}
