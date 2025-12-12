import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFocusEnhanced } from '@/hooks/useFocusEnhanced';
import { cn } from '@/lib/utils';

interface SessionTagSelectorInlineProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

const PRESET_COLORS = [
  '#42A5F5', // Bleu
  '#5C6BC0', // Indigo
  '#66BB6A', // Vert
  '#FFA726', // Orange
  '#AB47BC', // Violet
  '#EC407A', // Rose
  '#26C6DA', // Cyan
  '#9CCC65', // Lime
  '#FF7043', // Deep Orange
  '#8D6E63', // Marron
];

const DEFAULT_EMOJIS = ['📌', '🏠', '💼', '💪', '📚', '🚀', '🎨', '⚡', '🎯', '🌟', '🔥', '💡'];

export function SessionTagSelectorInline({ value, onChange }: SessionTagSelectorInlineProps) {
  const { tags, createTag, deleteTag } = useFocusEnhanced();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    await createTag.mutateAsync({
      name: newTagName.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
    });

    // Réinitialiser et fermer
    setNewTagName('');
    setSelectedEmoji(DEFAULT_EMOJIS[0]);
    setSelectedColor(PRESET_COLORS[0]);
    setShowCreateDialog(false);
  };

  const handleDeleteTag = async (tagId: string, isDefault: boolean) => {
    if (isDefault) return; // Ne pas permettre la suppression des tags par défaut

    if (confirm('Êtes-vous sûr de vouloir supprimer ce tag ?')) {
      await deleteTag.mutateAsync(tagId);

      // Si le tag supprimé était sélectionné, le retirer de la sélection
      const deletedTag = tags.find(t => t.id === tagId);
      if (deletedTag && value.includes(deletedTag.name)) {
        onChange(value.filter(v => v !== deletedTag.name));
      }
    }
  };

  const toggleTag = (tagName: string) => {
    if (value.includes(tagName)) {
      onChange(value.filter(v => v !== tagName));
    } else {
      onChange([...value, tagName]);
    }
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Catégories de session
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="h-7 px-2 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Créer
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Tags */}
          {tags.map((tag) => {
            const isSelected = value.includes(tag.name);

            return (
              <div key={tag.id} className="relative group">
                <button
                  onClick={() => toggleTag(tag.name)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 relative",
                    isSelected
                      ? "shadow-soft-md"
                      : "hover:shadow-soft-sm"
                  )}
                  style={{
                    backgroundColor: isSelected ? `${tag.color}20` : 'transparent',
                    borderColor: isSelected ? tag.color : 'transparent',
                    color: isSelected ? tag.color : 'inherit',
                  }}
                >
                  <span className="mr-1">{tag.emoji}</span>
                  {tag.name}
                </button>

                {/* Bouton supprimer (seulement pour tags personnalisés) */}
                {!tag.is_default && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTag(tag.id, tag.is_default);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:scale-110"
                    title="Supprimer ce tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {value.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {value.length} tag{value.length > 1 ? 's' : ''} sélectionné{value.length > 1 ? 's' : ''} : <strong>{value.map(v => `#${v}`).join(', ')}</strong>
          </p>
        )}
      </div>

      {/* Dialog de création de tag */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau tag</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nom du tag */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nom du tag
              </label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="ex: projet, formation, personnel..."
                maxLength={20}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateTag();
                  }
                }}
              />
            </div>

            {/* Sélection emoji */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={cn(
                      "w-10 h-10 text-xl rounded-lg transition-all",
                      selectedEmoji === emoji
                        ? "bg-primary/20 ring-2 ring-primary scale-110"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Sélection couleur */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Couleur
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all",
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-foreground scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Aperçu */}
            <div className="pt-4 border-t border-border">
              <label className="text-sm font-medium mb-2 block">
                Aperçu
              </label>
              <div
                className="inline-flex px-3 py-2 rounded-xl text-sm font-medium border-2"
                style={{
                  backgroundColor: `${selectedColor}20`,
                  borderColor: selectedColor,
                  color: selectedColor,
                }}
              >
                <span className="mr-1">{selectedEmoji}</span>
                {newTagName || 'Nom du tag'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || createTag.isPending}
            >
              {createTag.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
