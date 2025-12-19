import { motion } from 'framer-motion';
import { ENERGY_LEVELS } from '@/types';
import { cn } from '@/lib/utils';

interface CompactEnergySelectorProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export function CompactEnergySelector({ value, onChange }: CompactEnergySelectorProps) {
  return (
    <div className="flex gap-1 items-center">
      {ENERGY_LEVELS.map((level) => (
        <motion.button
          key={level.value}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(value === level.value ? undefined : level.value)}
          className={cn(
            "w-8 h-8 rounded-lg transition-all flex items-center justify-center text-lg",
            value === level.value
              ? "ring-2 ring-offset-1"
              : "opacity-50 hover:opacity-100"
          )}
          style={{
            backgroundColor: value === level.value ? `${level.color}20` : 'transparent',
            ['--tw-ring-color' as string]: value === level.value ? level.color : undefined,
          }}
          title={level.label}
        >
          {level.emoji}
        </motion.button>
      ))}
    </div>
  );
}
