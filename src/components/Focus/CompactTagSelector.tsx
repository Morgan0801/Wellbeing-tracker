import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFocusEnhanced } from '@/hooks/useFocusEnhanced';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CompactTagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxSelection?: number;
}

const PRESET_COLORS = [
  '#42A5F5', '#5C6BC0', '#66BB6A', '#FFA726', '#AB47BC', '#EC407A',
  '#26C6DA', '#9CCC65', '#FF7043', '#8D6E63',
];

const DEFAULT_EMOJIS = ['📌', '🏠', '💼', '💪', '📚', '🚀', '🎨', '⚡', '🎯', '🌟', '🔥', '💡'];

export function CompactTagSelector({
  value,
  onChange,
  maxSelection = 5,
}: CompactTagSelectorProps) {
  const { tags, recentTags, createTag } = useFocusEnhanced();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Afficher les tags récents en premier, puis les autres
  const sortedTags = [...tags].sort((a, b) => {
    const aRecent = recentTags.indexOf(a.name);
    const bRecent = recentTags.indexOf(b.name);
    if (aRecent !== -1 && bRecent === -1) return -1;
    if (aRecent === -1 && bRecent !== -1) return 1;
    if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
    return a.name.localeCompare(b.name);
  });

  const toggleTag = (tagName: string) => {
    if (value.includes(tagName)) {
      onChange(value.filter(v => v !== tagName));
    } else if (value.length < maxSelection) {
      onChange([...value, tagName]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    await createTag.mutateAsync({
      name: newTagName.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
    });

    setNewTagName('');
    setSelectedEmoji(DEFAULT_EMOJIS[0]);
    setSelectedColor(PRESET_COLORS[0]);
    setShowCreateDialog(false);
  };

  return (
    <>
      <div className="flex flex-wrap gap-1.5 items-center">
        {sortedTags.slice(0, 8).map((tag) => {
          const isSelected = value.includes(tag.name);
          return (
            <motion.button
              key={tag.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleTag(tag.name)}
              className={cn(
                "px-2 py-1 rounded-lg text-xs font-medium transition-all border",
                isSelected
                  ? "shadow-sm"
                  : "hover:shadow-sm opacity-70 hover:opacity-100"
              )}
              style={{
                backgroundColor: isSelected ? `${tag.color}30` : `${tag.color}10`,
                borderColor: isSelected ? tag.color : 'transparent',
                color: tag.color,
              }}
            >
              <span className="mr-0.5">{tag.emoji}</span>
              {tag.name}
            </motion.button>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="h-6 px-2 text-xs"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Dialog création */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouveau tag</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nom du tag"
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
            />

            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {DEFAULT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={cn(
                      "w-8 h-8 text-lg rounded-lg transition-all",
                      selectedEmoji === emoji
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-lg transition-all",
                      selectedColor === color
                        ? "ring-2 ring-offset-1 ring-foreground"
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} size="sm">
              Annuler
            </Button>
            <Button onClick={handleCreateTag} disabled={!newTagName.trim()} size="sm">
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
