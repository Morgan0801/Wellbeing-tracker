import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const HARDCODED_PASSWORD = 'pcduGamer!08';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, logout: logoutStore, user } = useAuthStore();

  const login = async (password: string) => {
    setLoading(true);
    setError(null);

    try {
      // VÃ©rification simple cÃ´tÃ© client pour Phase 1
      if (password !== HARDCODED_PASSWORD) {
        throw new Error('Mot de passe incorrect');
      }

      // CrÃ©er ou rÃ©cupÃ©rer l'utilisateur dans Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .single();

      if (existingUser) {
        setUser(existingUser);
      } else {
        // CrÃ©er un nouvel utilisateur si aucun n'existe
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              settings: {
                theme: 'light',
                widgets_visible: ['mood', 'weather', 'stats'],
              },
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        setUser(newUser);
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logoutStore();
  };

  return {
    user,
    login,
    logout,
    loading,
    error,
  };
}
