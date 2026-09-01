import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface GoogleLoginPromptProps {
  onAuthStart?: () => void;
}

const GoogleLoginPrompt: React.FC<GoogleLoginPromptProps> = ({ onAuthStart }) => {
  const { signIn, signInAsDemo } = useAuthContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showDemoOptions, setShowDemoOptions] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 500);
    const timer2 = setTimeout(() => setStep(2), 1500);
    const timer3 = setTimeout(() => setStep(3), 2000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    if (onAuthStart) onAuthStart();
    try {
      await signIn();
    } catch (err) {
      console.warn('Google sign-in failed, showing quick demo access options:', err);
      setIsLoggingIn(false);
      setShowDemoOptions(true);
    }
  };

  const handleDemoLogin = (email: string, name: string) => {
    signInAsDemo(email, name);
    // Allow state to settle before navigating
    setTimeout(() => {
      navigate('/garden');
    }, 50);
  };

  return (
    <div className="login-prompt">
      <AnimatePresence>
        {step >= 1 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="login-prompt__text"
          >
            Okay...
          </motion.p>
        )}
        {step >= 2 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="login-prompt__text"
          >
            But I need to know if you're actually you.
          </motion.p>
        )}
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
          >
            <button 
              className="google-btn" 
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
            >
              <svg className="google-btn__icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoggingIn ? 'Connecting to Google...' : 'Continue with Google'}
            </button>

            {/* Quick Private Direct Access / Fallback toggle */}
            {!showDemoOptions ? (
              <button 
                onClick={() => setShowDemoOptions(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-dim)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginTop: '0.5rem'
                }}
              >
                Quick Direct Sign-In (Demo Access)
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  alignItems: 'center',
                  background: 'var(--glass-bg)',
                  padding: '1rem 1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  border: 'var(--border-subtle)',
                  marginTop: '0.5rem'
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Select authorized person to enter:
                </span>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <button
                    className="google-btn"
                    style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                    onClick={() => handleDemoLogin('pratimahansda14@gmail.com', 'Pratima')}
                  >
                    🌸 I'm Pratima
                  </button>
                  <button
                    className="google-btn"
                    style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                    onClick={() => handleDemoLogin('sachingupta706155@gmail.com', 'Sachin')}
                  >
                    🌧 I'm Sachin
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoogleLoginPrompt;
