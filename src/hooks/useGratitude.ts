import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { GratitudeEntry } from '@/types/phase4-types';

export function useGratitude() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('gratitude_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const addEntry = async (entry: Omit<GratitudeEntry, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('gratitude_entries')
      .insert({
        user_id: user.id,
        ...entry,
      })
      .select()
      .single();

    if (!error && data) {
      setEntries([data, ...entries]);
      return data;
    }
  };

  const updateEntry = async (id: string, updates: Partial<GratitudeEntry>) => {
    const { data, error } = await supabase
      .from('gratitude_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setEntries(entries.map((e) => (e.id === id ? data : e)));
    }
  };

  const deleteEntry = async (id: string) => {
    await supabase.from('gratitude_entries').delete().eq('id', id);
    setEntries(entries.filter((e) => e.id !== id));
  };

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    refreshEntries: fetchEntries,
  };
}
