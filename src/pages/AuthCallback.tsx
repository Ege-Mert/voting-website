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
          console.error('No code provided in callback URL');
          navigate('/login');
          return;
        }

        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Error exchanging code for session:', error);
          navigate('/login');
          return;
        }

        if (!data.session) {
          console.error('No session returned from exchange');
          navigate('/login');
          return;
        }

        // Get user data to determine role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.session.user.id)
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