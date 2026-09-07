interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      {icon && (
        <div className="text-[var(--aws-text-muted)] opacity-50">{icon}</div>
      )}
      <div className="space-y-1">
        <p className="font-semibold text-[var(--aws-text)]">{title}</p>
        {description && (
          <p className="text-sm text-[var(--aws-text-muted)] max-w-xs">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
