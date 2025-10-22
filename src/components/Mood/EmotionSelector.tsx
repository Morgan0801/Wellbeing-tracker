import { EMOTIONS } from '@/types';
import { cn } from '@/lib/utils';

interface EmotionSelectorProps {
  selectedEmotions: string[];
  onChange: (emotions: string[]) => void;
}

export function EmotionSelector({ selectedEmotions, onChange }: EmotionSelectorProps) {
  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      onChange(selectedEmotions.filter((e) => e !== emotion));
    } else {
      onChange([...selectedEmotions, emotion]);
    }
  };

  const groupedEmotions = {
    positive: EMOTIONS.filter((e) => e.type === 'positive'),
    neutral: EMOTIONS.filter((e) => e.type === 'neutral'),
    negative: EMOTIONS.filter((e) => e.type === 'negative'),
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
          Émotions positives
        </h4>
        <div className="flex flex-wrap gap-2">
          {groupedEmotions.positive.map((emotion) => (
            <button
              key={emotion.label}
              type="button"
              onClick={() => toggleEmotion(emotion.label)}
              className={cn(
                'px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium',
                selectedEmotions.includes(emotion.label)
                  ? 'bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-500'
                  : 'bg-white border-gray-200 hover:border-green-300 dark:bg-gray-800 dark:border-gray-700'
              )}
            >
              <span className="mr-1">{emotion.emoji}</span>
              {emotion.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
          Émotions neutres
        </h4>
        <div className="flex flex-wrap gap-2">
          {groupedEmotions.neutral.map((emotion) => (
            <button
              key={emotion.label}
              type="button"
              onClick={() => toggleEmotion(emotion.label)}
              className={cn(
                'px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium',
                selectedEmotions.includes(emotion.label)
                  ? 'bg-gray-100 border-gray-500 dark:bg-gray-700 dark:border-gray-500'
                  : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700'
              )}
            >
              <span className="mr-1">{emotion.emoji}</span>
              {emotion.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
          Émotions négatives
        </h4>
        <div className="flex flex-wrap gap-2">
          {groupedEmotions.negative.map((emotion) => (
            <button
              key={emotion.label}
              type="button"
              onClick={() => toggleEmotion(emotion.label)}
              className={cn(
                'px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium',
                selectedEmotions.includes(emotion.label)
                  ? 'bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-500'
                  : 'bg-white border-gray-200 hover:border-red-300 dark:bg-gray-800 dark:border-gray-700'
              )}
            >
              <span className="mr-1">{emotion.emoji}</span>
              {emotion.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
