import { createContext, useCallback, useState, ReactNode, useEffect } from 'react';
import { useSupabase } from './SupabaseContext';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { supabase } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        // If user doesn't exist in our users table, create them
        if (userError.code === 'PGRST116') {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const newUser = {
              id: authUser.id,
              email: authUser.email!,
              name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'User',
              role: 'voter' as const,
              created_at: new Date().toISOString()
            };

            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert(newUser)
              .select()
              .single();

            if (createError) {
              throw createError;
            }
            return createdUser;
          }
        }
        throw userError;
      }
      
      return userData;
    } catch (err) {
      console.error('Error fetching user data:', err);
      throw err;
    }
  }, [supabase]);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      if (session) {
        const userData = await fetchUserData(session.user.id);
        setUser(userData as User);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      setError('Failed to authenticate user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchUserData]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          try {
            const userData = await fetchUserData(session.user.id);
            setUser(userData as User);
            
            // Clean up URL parameters after successful auth
            if (window.location.search || window.location.hash) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (err) {
            console.error('Error handling sign in:', err);
            setError('Failed to load user data');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Initial auth check
    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, checkAuth, fetchUserData]);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting Google OAuth...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

      console.log('OAuth redirect URL:', data?.url);
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };
  
  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      error,
      signInWithGoogle,
      signOut,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};