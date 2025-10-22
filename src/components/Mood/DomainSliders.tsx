import { DOMAINS, DomainType } from '@/types';
import { Slider } from '@/components/ui/slider';

interface DomainSlidersProps {
  domains: Record<DomainType, number>;
  onChange: (domain: DomainType, value: number) => void;
}

export function DomainSliders({ domains, onChange }: DomainSlidersProps) {
  const getImpactColor = (impact: number) => {
    if (impact < 0) return 'text-red-600 dark:text-red-400';
    if (impact > 0) return 'text-green-600 dark:text-green-400';
    return 'text-gray-500 dark:text-gray-400';
  };

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
            <span className={`text-sm font-semibold ${getImpactColor(domains[domain.type])}`}>
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
