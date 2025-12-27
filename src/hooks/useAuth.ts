import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, logout: logoutStore, user } = useAuthStore();

  const login = async (password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Validation du mot de passe via Edge Function (côté serveur)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ password })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Mot de passe incorrect');
      }

      // Créer ou récupérer l'utilisateur dans Supabase
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
