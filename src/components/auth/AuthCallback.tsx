import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { isEmailAllowed } from '../../lib/auth';
import ThemedLoader from '../layout/ThemedLoader';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const processAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          navigate('/');
          return;
        }

        const email = session.user.email;
        if (email && isEmailAllowed(email)) {
          navigate('/garden');
        } else {
          navigate('/denied');
        }
      } catch (err) {
        console.error('Auth processing error:', err);
        navigate('/');
      }
    };

    processAuth();
  }, [navigate]);

  return <ThemedLoader />;
};

export default AuthCallback;
