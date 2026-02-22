import { DOMAINS, DomainType } from '@/types';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface DomainSlidersProps {
  domains: Record<DomainType, number>;
  onChange: (domain: DomainType, value: number) => void;
}

export function DomainSliders({ domains, onChange }: DomainSlidersProps) {
  const getImpactLabel = (impact: number) => {
    if (impact === 0) return 'Neutre';
    if (impact > 0) return `+${impact}`;
    return impact.toString();
  };

  return (
    <div className="space-y-4">
      {DOMAINS.map((domain) => (
        <div key={domain.type} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <span className="text-xl">{domain.emoji}</span>
              {domain.label}
            </label>
            <span className={cn(
              'text-sm font-bold px-2 py-0.5 rounded-full min-w-[2.5rem] text-center',
              domains[domain.type] < 0
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : domains[domain.type] > 0
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            )}>
              {getImpactLabel(domains[domain.type])}
            </span>
          </div>
          <div className="relative">
            <Slider
              value={domains[domain.type]}
              onChange={(value) => onChange(domain.type, value)}
              min={-5}
              max={5}
              step={1}
              className="slider-custom"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Très négatif</span>
              <span>Neutre</span>
              <span>Très positif</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
