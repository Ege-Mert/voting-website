import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import LoadingScreen from '../components/common/LoadingScreen';

const AuthCallback = () => {
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase automatically exchanges the code from the URL when
        // `detectSessionInUrl` is enabled. Retrieve the current session.
        const {
          data: { session },
          error
        } = await supabase.auth.getSession();

        if (error || !session) {
          console.error('No active session:', error);
          navigate('/login');
          return;
        }

        // Get user data to determine role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          navigate('/');
          return;
        }

        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        // Redirect based on role
        if (userData?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [supabase, navigate]);

  return <LoadingScreen />;
};

export default AuthCallback;