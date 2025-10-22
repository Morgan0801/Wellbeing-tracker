import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGratitude } from '@/hooks/useGratitude';

interface GratitudeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOOD_EMOJIS = ['😊', '😌', '🥰', '😄', '🙏', '✨'];

export function GratitudeModal({ open, onOpenChange }: GratitudeModalProps) {
  const { addEntry } = useGratitude();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entry1, setEntry1] = useState('');
  const [entry2, setEntry2] = useState('');
  const [entry3, setEntry3] = useState('');
  const [moodEmoji, setMoodEmoji] = useState('😊');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    addEntry({
      date,
      entry_1: entry1,
      entry_2: entry2 || undefined,
      entry_3: entry3 || undefined,
      mood_emoji: moodEmoji,
    });

    onOpenChange(false);
    // Reset form
    setDate(new Date().toISOString().split('T')[0]);
    setEntry1('');
    setEntry2('');
    setEntry3('');
    setMoodEmoji('😊');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Journal de gratitude</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Entry 1 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Je suis reconnaissant(e) pour... *
            </label>
            <textarea
              value={entry1}
              onChange={(e) => setEntry1(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="La première chose qui me vient..."
              required
            />
          </div>

          {/* Entry 2 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Deuxième chose (optionnel)
            </label>
            <textarea
              value={entry2}
              onChange={(e) => setEntry2(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Une autre raison d'être reconnaissant..."
            />
          </div>

          {/* Entry 3 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Troisième chose (optionnel)
            </label>
            <textarea
              value={entry3}
              onChange={(e) => setEntry3(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Et encore une autre..."
            />
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium mb-2">Comment je me sens ?</label>
            <div className="flex gap-2">
              {MOOD_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setMoodEmoji(emoji)}
                  className={`
                    text-3xl p-2 rounded-lg transition-all
                    ${moodEmoji === emoji 
                      ? 'bg-blue-100 dark:bg-blue-900 scale-110' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
