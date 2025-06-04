import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import LoadingScreen from '../components/common/LoadingScreen';

const AuthCallback = () => {
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | undefined;

    const handleSession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (!session) {
        navigate('/login');
        return;
      }

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

      window.history.replaceState({}, document.title, window.location.pathname);

      if (userData?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    };

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          await handleSession(data.session);
        } else {
          subscription = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
              await handleSession(session);
            } else if (event === 'SIGNED_OUT') {
              navigate('/login');
            }
          }).data.subscription;
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        navigate('/login');
      }
    };

    init();

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, navigate]);

  return <LoadingScreen />;
};

export default AuthCallback;