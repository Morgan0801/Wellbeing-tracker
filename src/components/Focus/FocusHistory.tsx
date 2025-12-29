import { useCallback, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Edit3, Coffee, Timer, Brain, Trash2, Target, Zap, Star, AlertCircle, Hourglass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/ui/button';
import { useFocusEnhanced } from '@/hooks/useFocusEnhanced';
import { motion } from 'framer-motion';
import { staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { FocusSession, SessionType, ENERGY_LEVELS } from '@/types';
import { EditSessionModal } from './EditSessionModal';

interface FocusHistoryProps {
  limit?: number;
}

const SESSION_TYPE_ICONS: Record<SessionType, any> = {
  pomodoro: Timer,
  short_break: Coffee,
  long_break: Brain,
  stopwatch: Hourglass,
};

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  pomodoro: 'Focus',
  short_break: 'Pause courte',
  long_break: 'Pause longue',
  stopwatch: 'Chronomètre',
};

export function FocusHistory({ limit = 10 }: FocusHistoryProps) {
  const { recentSessions, tags, deleteSession, updateSession } = useFocusEnhanced();
  const [editingSession, setEditingSession] = useState<FocusSession | null>(null);

  const displaySessions = limit ? recentSessions.slice(0, limit) : recentSessions;

  const handleEdit = useCallback((session: FocusSession) => {
    setEditingSession(session);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingSession(null);
  }, []);

  const handleDelete = useCallback((session: FocusSession) => {
    const confirmed = window.confirm('Supprimer cette session ? Cette action est irréversible.');
    if (!confirmed) return;
    deleteSession.mutate(session.id);
  }, [deleteSession]);

  if (displaySessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune session enregistrée</p>
            <p className="text-xs mt-1">
              Vos sessions Pomodoro apparaîtront ici
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique des sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displaySessions.map((session, index) => {
            const SessionIcon = SESSION_TYPE_ICONS[session.session_type];

            return (
              <motion.div
                key={session.id}
                variants={staggerItem}
                initial="initial"
                animate="animate"
                custom={index}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg transition-colors",
                  session.completed
                    ? "bg-muted/10 hover:bg-muted/20"
                    : "bg-muted/5 opacity-60"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "p-2.5 rounded-xl shrink-0",
                    session.session_type === 'pomodoro'
                      ? "bg-focus/20"
                      : session.session_type === 'short_break'
                      ? "bg-vitality/20"
                      : "bg-sleep/20"
                  )}
                >
                  <SessionIcon
                    className={cn(
                      "w-5 h-5",
                      session.session_type === 'pomodoro'
                        ? "text-focus"
                        : session.session_type === 'short_break'
                        ? "text-vitality"
                        : "text-sleep"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {SESSION_TYPE_LABELS[session.session_type]}
                    </span>

                    {/* Tags Badges (plusieurs tags possibles) */}
                    {session.tags && session.tags.length > 0 && session.tags.map((tagName) => {
                      const tagInfo = tags.find((t) => t.name === tagName);
                      if (!tagInfo) return null;

                      return (
                        <span
                          key={tagName}
                          className="px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{
                            backgroundColor: `${tagInfo.color}20`,
                            color: tagInfo.color,
                          }}
                        >
                          <span className="mr-1">{tagInfo.emoji}</span>
                          {tagName}
                        </span>
                      );
                    })}

                    {/* Manual Entry Badge */}
                    {session.is_manual_entry && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-productivity/20 text-productivity flex items-center gap-1">
                        <Edit3 className="w-3 h-3" />
                        Manuel
                      </span>
                    )}

                    {/* Completion Badge */}
                    {!session.completed && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                        Incomplet
                      </span>
                    )}
                  </div>

                  {/* Time and Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>
                      {format(new Date(session.start_time), 'HH:mm', { locale: fr })}
                    </span>
                    <span>•</span>
                    <span>
                      {format(new Date(session.start_time), 'dd MMM yyyy', {
                        locale: fr,
                      })}
                    </span>
                    {session.notes && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[200px]" title={session.notes}>
                          {session.notes}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Objectif */}
                  {session.objective && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Target className="w-3 h-3" />
                      <span className="truncate max-w-[300px]" title={session.objective}>
                        {session.objective}
                      </span>
                    </div>
                  )}

                  {/* Métriques de qualité */}
                  {(session.pre_energy_level || session.post_focus_quality || session.distractions_count !== undefined) && (
                    <div className="flex items-center gap-3 mt-2">
                      {session.pre_energy_level && (
                        <div className="flex items-center gap-1 text-xs">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="font-medium">{ENERGY_LEVELS[session.pre_energy_level - 1]?.emoji}</span>
                          <span className="text-muted-foreground">Énergie: {session.pre_energy_level}/5</span>
                        </div>
                      )}
                      {session.post_focus_quality && (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-amber-500" />
                          <span className="text-muted-foreground">Focus: {session.post_focus_quality}/5</span>
                        </div>
                      )}
                      {session.distractions_count !== undefined && session.distractions_count > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <AlertCircle className="w-3 h-3 text-destructive" />
                          <span className="text-destructive">{session.distractions_count} distraction{session.distractions_count > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {session.session_mood && (
                        <span className="text-base" title="Humeur">
                          {session.session_mood}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm">
                    {session.duration_minutes} min
                  </div>
                  {session.quality_rating && (
                    <div className="text-xs text-muted-foreground">
                      {'⭐'.repeat(session.quality_rating)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <IconButton
                    aria-label="Modifier la session"
                    onClick={() => handleEdit(session)}
                    disabled={deleteSession.isPending || updateSession.isPending}
                    title="Modifier"
                  >
                    <Edit3 className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    aria-label="Supprimer la session"
                    onClick={() => handleDelete(session)}
                    disabled={deleteSession.isPending || updateSession.isPending}
                    className="text-destructive hover:text-destructive"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </motion.div>
            );
          })}
        </div>

        <EditSessionModal
          open={!!editingSession}
          session={editingSession}
          tags={tags}
          isSaving={updateSession.isPending}
          onClose={handleCloseEdit}
          onSave={(input) => updateSession.mutateAsync(input)}
        />

        {/* Show More Button */}
        {limit && recentSessions.length > limit && (
          <div className="text-center mt-4">
            <p className="text-xs text-muted-foreground">
              {recentSessions.length - limit} session(s) supplémentaire(s) disponible(s)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
