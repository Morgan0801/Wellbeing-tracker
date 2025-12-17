import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DISTRACTION_TYPES, DistractionType } from '@/types';
import { cn } from '@/lib/utils';

interface DistractionTrackerProps {
  count: number;
  onAddDistraction: (type: DistractionType) => void;
  isVisible: boolean;
}

export function DistractionTracker({
  count,
  onAddDistraction,
  isVisible,
}: DistractionTrackerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 right-4 z-40"
    >
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-card rounded-2xl shadow-soft-xl p-4 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Distraction ?</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpanded(false)}
                className="h-6 w-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DISTRACTION_TYPES.map((type) => (
                <motion.button
                  key={type.type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onAddDistraction(type.type);
                    setExpanded(false);
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted/20 transition-colors"
                >
                  <span className="text-xl">{type.emoji}</span>
                  <span className="text-xs text-muted-foreground text-center">{type.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-full shadow-soft-lg transition-colors",
              count > 0
                ? "bg-destructive/10 border border-destructive/30"
                : "bg-card border border-border"
            )}
          >
            <AlertCircle className={cn(
              "w-4 h-4",
              count > 0 ? "text-destructive" : "text-muted-foreground"
            )} />
            <span className="text-sm font-medium">
              {count} distraction{count !== 1 ? 's' : ''}
            </span>
            <Plus className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
