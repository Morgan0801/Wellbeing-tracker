import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Edit3, Coffee, Timer, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFocusEnhanced } from '@/hooks/useFocusEnhanced';
import { motion } from 'framer-motion';
import { staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { SessionType } from '@/types';

interface FocusHistoryProps {
  limit?: number;
}

const SESSION_TYPE_ICONS: Record<SessionType, any> = {
  pomodoro: Timer,
  short_break: Coffee,
  long_break: Brain,
};

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  pomodoro: 'Focus',
  short_break: 'Pause courte',
  long_break: 'Pause longue',
};

export function FocusHistory({ limit = 10 }: FocusHistoryProps) {
  const { recentSessions, tags } = useFocusEnhanced();

  const displaySessions = limit ? recentSessions.slice(0, limit) : recentSessions;

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
            const tag = tags.find((t) => t.name === session.category);

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

                    {/* Category Badge */}
                    {session.category && tag && (
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        }}
                      >
                        <span className="mr-1">{tag.emoji}</span>
                        {session.category}
                      </span>
                    )}

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
              </motion.div>
            );
          })}
        </div>

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
