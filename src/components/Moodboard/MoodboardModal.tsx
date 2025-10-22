import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMoodboard } from '@/hooks/useMoodboard';

interface MoodboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPES = [
  { id: 'quote', label: 'Citation', icon: '💬' },
  { id: 'affirmation', label: 'Affirmation', icon: '✨' },
  { id: 'image', label: 'Image URL', icon: '🖼️' },
];

const CATEGORIES = [
  { id: 'motivation', label: 'Motivation', color: '#f59e0b' },
  { id: 'calme', label: 'Calme', color: '#3b82f6' },
  { id: 'joie', label: 'Joie', color: '#eab308' },
  { id: 'inspiration', label: 'Inspiration', color: '#8b5cf6' },
];

export function MoodboardModal({ open, onOpenChange }: MoodboardModalProps) {
  const { addItem } = useMoodboard();
  const [type, setType] = useState<'quote' | 'affirmation' | 'image'>('quote');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('motivation');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    addItem({
      type,
      content,
      author: author || undefined,
      category,
    });

    onOpenChange(false);
    // Reset form
    setType('quote');
    setContent('');
    setAuthor('');
    setCategory('motivation');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Ajouter au Moodboard</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as any)}
                  className={`
                    flex flex-col items-center gap-1 p-3 border rounded-lg transition-all
                    ${type === t.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:border-gray-400'
                    }
                  `}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {type === 'image' ? 'URL de l\'image *' : 'Texte *'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              rows={type === 'image' ? 2 : 4}
              placeholder={
                type === 'image' 
                  ? 'https://example.com/image.jpg' 
                  : type === 'quote'
                  ? 'Entrez votre citation inspirante...'
                  : 'Entrez votre affirmation positive...'
              }
              required
            />
          </div>

          {/* Author (only for quotes) */}
          {type === 'quote' && (
            <div>
              <label className="block text-sm font-medium mb-1">Auteur (optionnel)</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                placeholder="Nom de l'auteur"
              />
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Catégorie</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`
                    p-2 border rounded-lg text-sm font-medium transition-all
                    ${category === cat.id 
                      ? 'border-2 shadow-sm' 
                      : 'hover:border-gray-400'
                    }
                  `}
                  style={{
                    borderColor: category === cat.id ? cat.color : undefined,
                    backgroundColor: category === cat.id ? `${cat.color}20` : undefined,
                  }}
                >
                  {cat.label}
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
              Ajouter
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
