import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface XPHistoryEntry {
  id: string;
  user_id: string;
  action_type: string;
  xp_gained: number;
  description: string | null;
  created_at: string;
}

export function useXPHistory() {
  const { data: xpHistory = [], isLoading } = useQuery({
    queryKey: ['xp_history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('xp_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as XPHistoryEntry[];
    },
  });

  return {
    xpHistory,
    isLoading,
  };
}
