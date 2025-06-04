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
        // Get the code from the URL
        const code = new URLSearchParams(window.location.search).get('code');
        
        if (!code) {
          throw new Error('No code provided in callback URL');
        }

        // Exchange the code for a session
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          throw error;
        }

        if (session) {
          // Get user data to determine role
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          // Clean up URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);

          // Redirect based on role
          if (userData?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          navigate('/login');
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