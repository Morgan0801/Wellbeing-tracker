import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { MoodboardItem } from '@/types/phase4-types';

export function useMoodboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('moodboard_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  const addItem = async (item: Omit<MoodboardItem, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('moodboard_items')
      .insert({
        user_id: user.id,
        ...item,
      })
      .select()
      .single();

    if (!error && data) {
      setItems([data, ...items]);
      return data;
    }
  };

  const updateItem = async (id: string, updates: Partial<MoodboardItem>) => {
    const { data, error } = await supabase
      .from('moodboard_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setItems(items.map((item) => (item.id === id ? data : item)));
    }
  };

  const deleteItem = async (id: string) => {
    await supabase.from('moodboard_items').delete().eq('id', id);
    setItems(items.filter((item) => item.id !== id));
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    refreshItems: fetchItems,
  };
}
