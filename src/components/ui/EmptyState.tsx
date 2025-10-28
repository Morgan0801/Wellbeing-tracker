import { LucideIcon } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor = 'text-gray-400',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-12 px-4 text-center">
      <Icon className={`w-12 h-12 md:w-16 md:h-16 ${iconColor} mb-3 md:mb-4 opacity-30`} />
      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 md:mb-2">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-md">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-4 md:mt-6"
          size="sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
