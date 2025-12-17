import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Star, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFocusEnhanced } from '@/hooks/useFocusEnhanced';
import { SessionTag } from '@/types';
import { cn } from '@/lib/utils';

interface EnhancedTagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxSelection?: number;
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

export function EnhancedTagSelector({
  value,
  onChange,
  maxSelection = 5,
}: EnhancedTagSelectorProps) {
  const { tags, recentTags, createTag, deleteTag } = useFocusEnhanced();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Favoris stockés dans localStorage
  const [favoriteTags, setFavoriteTags] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorite-tags');
    return saved ? JSON.parse(saved) : [];
  });

  // Filtrer les tags selon la recherche
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;
    const query = searchQuery.toLowerCase();
    return tags.filter(tag =>
      tag.name.toLowerCase().includes(query) ||
      tag.emoji.includes(query)
    );
  }, [tags, searchQuery]);

  // Trier: favoris → récents → alphabétique
  const sortedTags = useMemo(() => {
    return [...filteredTags].sort((a, b) => {
      const aFav = favoriteTags.includes(a.name);
      const bFav = favoriteTags.includes(b.name);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;

      const aRecent = recentTags.indexOf(a.name);
      const bRecent = recentTags.indexOf(b.name);
      if (aRecent !== -1 && bRecent === -1) return -1;
      if (aRecent === -1 && bRecent !== -1) return 1;
      if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;

      return a.name.localeCompare(b.name);
    });
  }, [filteredTags, favoriteTags, recentTags]);

  const toggleTag = useCallback((tagName: string) => {
    if (value.includes(tagName)) {
      onChange(value.filter(v => v !== tagName));
    } else if (value.length < maxSelection) {
      onChange([...value, tagName]);
    }
  }, [value, onChange, maxSelection]);

  const toggleFavorite = useCallback((tagName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = favoriteTags.includes(tagName)
      ? favoriteTags.filter(f => f !== tagName)
      : [...favoriteTags, tagName];
    setFavoriteTags(newFavorites);
    localStorage.setItem('favorite-tags', JSON.stringify(newFavorites));
  }, [favoriteTags]);

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

  const handleDeleteTag = async (tagId: string, tagName: string, isDefault: boolean) => {
    if (isDefault) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce tag ?')) {
      await deleteTag.mutateAsync(tagId);

      // Retirer de la sélection si nécessaire
      if (value.includes(tagName)) {
        onChange(value.filter(v => v !== tagName));
      }
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header avec recherche */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un tag..."
              className="pl-10 h-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="h-10 px-3"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nouveau
          </Button>
        </div>

        {/* Tags récents */}
        {!searchQuery && recentTags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Récents
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentTags.slice(0, 5).map((tagName) => {
                const tag = tags.find(t => t.name === tagName);
                if (!tag) return null;
                const isSelected = value.includes(tagName);
                return (
                  <TagChip
                    key={`recent-${tagName}`}
                    tag={tag}
                    isSelected={isSelected}
                    isFavorite={favoriteTags.includes(tagName)}
                    onClick={() => toggleTag(tagName)}
                    onFavoriteClick={(e) => toggleFavorite(tagName, e)}
                    size="sm"
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Tous les tags */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Tous les tags ({sortedTags.length})
            </span>
            {value.length > 0 && (
              <span className="text-xs bg-focus/20 text-focus px-2 py-0.5 rounded-full">
                {value.length}/{maxSelection} sélectionné{value.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <motion.div
            layout
            className="flex flex-wrap gap-2"
          >
            <AnimatePresence mode="popLayout">
              {sortedTags.map((tag) => {
                const isSelected = value.includes(tag.name);
                return (
                  <TagChip
                    key={tag.id}
                    tag={tag}
                    isSelected={isSelected}
                    isFavorite={favoriteTags.includes(tag.name)}
                    onClick={() => toggleTag(tag.name)}
                    onFavoriteClick={(e) => toggleFavorite(tag.name, e)}
                    onDelete={!tag.is_default ? () => handleDeleteTag(tag.id, tag.name, tag.is_default) : undefined}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Résumé sélection */}
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted/10 rounded-xl p-3"
          >
            <span className="text-xs text-muted-foreground">Sélection: </span>
            <span className="text-sm font-medium">
              {value.map(v => `#${v}`).join(', ')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="ml-2 h-6 px-2 text-xs"
            >
              Effacer
            </Button>
          </motion.div>
        )}
      </div>

      {/* Dialog création de tag */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau tag</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nom */}
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

            {/* Emoji */}
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

            {/* Couleur */}
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

// Composant TagChip
interface TagChipProps {
  tag: SessionTag;
  isSelected: boolean;
  isFavorite: boolean;
  onClick: () => void;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  size?: 'sm' | 'md';
}

function TagChip({
  tag,
  isSelected,
  isFavorite,
  onClick,
  onFavoriteClick,
  onDelete,
  size = 'md',
}: TagChipProps) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative group flex items-center gap-1.5 rounded-xl font-medium transition-all border-2",
        size === 'sm' ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
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
      {/* Étoile favori */}
      {isFavorite && (
        <Star className="w-3 h-3 fill-current text-amber-500" />
      )}

      <span>{tag.emoji}</span>
      <span>{tag.name}</span>

      {/* Actions au hover */}
      <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onFavoriteClick}
          className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star className="w-3 h-3" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            title="Supprimer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.button>
  );
}
