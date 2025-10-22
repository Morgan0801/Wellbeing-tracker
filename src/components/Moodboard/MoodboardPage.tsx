import { useState } from 'react';
import { Plus, Sparkles, Image as ImageIcon, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMoodboard } from '@/hooks/useMoodboard';
import { MOODBOARD_CATEGORIES, MoodboardCategory } from '@/types/phase4-types';
import { MoodboardModal } from './MoodboardModal';

export function MoodboardPage() {
  const { items, loading } = useMoodboard();
  const [selectedCategory, setSelectedCategory] = useState<MoodboardCategory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24 md:pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Mon Moodboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Votre espace d'inspiration personnelle
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Tout
        </Button>
        {MOODBOARD_CATEGORIES.map((cat) => (
          <Button
            key={cat.type}
            variant={selectedCategory === cat.type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.type)}
          >
            {cat.emoji} {cat.label}
          </Button>
        ))}
      </div>

      {/* Grille Masonry-style */}
      {filteredItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">
              {selectedCategory
                ? 'Aucun élément dans cette catégorie'
                : 'Votre moodboard est vide. Commencez à ajouter des inspirations !'}
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter ma première inspiration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {filteredItems.map((item) => {
            const category = MOODBOARD_CATEGORIES.find((c) => c.type === item.category);
            
            return (
              <Card
                key={item.id}
                className="break-inside-avoid hover:shadow-lg transition-shadow overflow-hidden"
                style={{ borderColor: `${category?.color}40` }}
              >
                {item.type === 'image' ? (
                  <div className="relative">
                    <img
                      src={item.content}
                      alt="Moodboard item"
                      className="w-full h-auto object-cover"
                    />
                    <div
                      className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
                      style={{
                        backgroundColor: `${category?.color}90`,
                        color: 'white',
                      }}
                    >
                      {category?.emoji} {category?.label}
                    </div>
                  </div>
                ) : (
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      {item.type === 'quote' ? (
                        <Quote className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${category?.color}20`,
                          color: category?.color,
                        }}
                      >
                        {category?.emoji} {category?.label}
                      </div>
                    </div>
                    
                    <p className="text-base italic text-gray-700 dark:text-gray-300 mb-3">
                      "{item.content}"
                    </p>
                    
                    {item.author && (
                      <p className="text-sm text-gray-500 text-right">
                        — {item.author}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Section d'inspiration */}
      <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
        <CardContent className="py-6">
          <div className="text-center space-y-3">
            <ImageIcon className="w-8 h-8 text-yellow-500 mx-auto" />
            <h3 className="font-semibold text-lg">Créez votre espace d'inspiration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Un moodboard est un outil puissant pour visualiser vos aspirations et maintenir une
              attitude positive. Ajoutez des images, citations et affirmations qui résonnent avec vous.
            </p>
          </div>
        </CardContent>
      </Card>
	        <MoodboardModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

    </div>
  );
}
