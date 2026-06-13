'use client';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-1.5">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-500 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-3 items-center">{actions}</div>}
    </div>
  );
}
