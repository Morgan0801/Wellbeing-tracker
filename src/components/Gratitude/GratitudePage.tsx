import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Heart, Sparkles, Flame, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useGratitude } from '@/hooks/useGratitude';
import { formatDate } from '@/lib/utils';
import { GratitudeModal } from './GratitudeModal';
import { staggerContainer, staggerItem } from '@/lib/animations';

export function GratitudePage() {
  const { entries, loading } = useGratitude();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Calculer la série actuelle
  const currentStreak = () => {
    if (entries.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const entry of entries) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = currentStreak();

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-gratitude border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="container mx-auto p-3 md:p-4 lg:p-5 pb-20 md:pb-6 space-y-3"
    >
      {/* Header */}
      <motion.div
        variants={staggerItem}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gratitude via-gratitude to-gratitude-light p-3 md:p-4 text-white shadow-soft-xl"
      >
        {/* Décorations */}
        <div className="absolute top-4 right-8 text-white/20">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <div className="absolute bottom-6 right-1/4 text-white/10">
          <Sparkles className="w-12 h-12" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-white/80" />
            <span className="text-sm font-medium text-white/80">Bien-être mental</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">
                Journal de Gratitude
              </h1>
              <p className="text-sm text-white/80">
                Cultivez la gratitude au quotidien
              </p>
            </div>

            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white text-gratitude hover:bg-white/90 shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle entrée
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistiques */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hover className="bg-gradient-to-br from-gratitude-light to-gratitude-light/30 dark:from-gratitude/15 dark:to-gratitude/5 border-0">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gratitude/10">
                <Heart className="w-6 h-6 text-gratitude" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total d'entrées</p>
                <p className="text-3xl font-display font-bold text-gratitude">{entries.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Moments de gratitude</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="bg-gradient-to-br from-focus-light to-focus-light/30 dark:from-focus/15 dark:to-focus/5 border-0">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-focus/10">
                <Flame className="w-6 h-6 text-focus" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Série actuelle</p>
                <p className="text-3xl font-display font-bold text-focus">{streak}</p>
                <p className="text-xs text-muted-foreground mt-1">Jour{streak > 1 ? 's' : ''} consécutif{streak > 1 ? 's' : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="bg-gradient-to-br from-sleep-light to-sleep-light/30 dark:from-sleep/15 dark:to-sleep/5 border-0">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-sleep/10">
                <Calendar className="w-6 h-6 text-sleep" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cette semaine</p>
                <p className="text-3xl font-display font-bold text-sleep">
                  {entries.filter((e) => {
                    const entryDate = new Date(e.date);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return entryDate >= weekAgo;
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">7 derniers jours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Citation inspirante */}
      <motion.div variants={staggerItem}>
        <Card variant="glass" className="border-primary/10">
          <CardContent className="py-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-center text-sm italic text-foreground max-w-lg mx-auto">
              "La gratitude transforme ce que nous avons en assez, et plus encore."
            </p>
            <p className="text-center text-xs text-muted-foreground mt-3">— Melody Beattie</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Liste des entrées */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gratitude/10">
            <Heart className="w-5 h-5 text-gratitude" />
          </div>
          <h2 className="text-lg font-display font-bold">Mes moments de gratitude</h2>
        </div>

        {entries.length === 0 ? (
          <Card variant="elevated" className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gratitude/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-gratitude" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Aucune entrée pour le moment</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Commencez votre journal de gratitude pour cultiver le bien-être au quotidien.
              </p>
              <Button onClick={() => setIsAddModalOpen(true)} variant="glow" size="lg" className="bg-gradient-to-r from-gratitude to-mood">
                Commencer mon journal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover variant="elevated">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-display">
                        {formatDate(new Date(entry.date), 'EEEE d MMMM yyyy')}
                      </CardTitle>
                      {entry.mood_emoji && (
                        <span className="text-2xl">{entry.mood_emoji}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gratitude/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-gratitude">1</span>
                        </div>
                        <p className="text-sm text-foreground flex-1">{entry.entry_1}</p>
                      </div>
                      {entry.entry_2 && (
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gratitude/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-gratitude">2</span>
                          </div>
                          <p className="text-sm text-foreground flex-1">{entry.entry_2}</p>
                        </div>
                      )}
                      {entry.entry_3 && (
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gratitude/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-gratitude">3</span>
                          </div>
                          <p className="text-sm text-foreground flex-1">{entry.entry_3}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Conseils */}
      <motion.div variants={staggerItem}>
        <Card variant="glass" className="border-vitality/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-vitality" />
              Conseils pour cultiver la gratitude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { text: "Écrivez chaque jour, de préférence le matin ou le soir", icon: "📝" },
                { text: "Soyez spécifique : détaillez pourquoi vous êtes reconnaissant", icon: "🎯" },
                { text: "Variez vos gratitudes : grandes et petites choses comptent", icon: "✨" },
                { text: "Relisez vos anciennes entrées lors de moments difficiles", icon: "💪" },
              ].map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                  <span className="text-xl">{tip.icon}</span>
                  <span className="text-sm text-foreground">{tip.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <GratitudeModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </motion.div>
  );
}
