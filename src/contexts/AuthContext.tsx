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
              role: 'voter' as const, // Default role for new users
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
      
      // Check if user is already authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
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

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            const userData = await fetchUserData(session.user.id);
            setUser(userData as User);
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
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          redirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) {
        throw error;
      }

      // Only redirect if we have a URL
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setError(err.message || 'Failed to sign in with Google');
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
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'Failed to sign out');
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