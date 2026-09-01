import React from 'react';
import { motion } from 'framer-motion';
import useSound from '../../hooks/useSound';
import useQuality from '../../hooks/useQuality';
import { useAuthContext } from '../../contexts/AuthContext';

const SettingsView: React.FC = () => {
  const { soundEnabled, toggleSound } = useSound();
  const { quality, setQuality } = useQuality();
  const { signOut } = useAuthContext();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      signOut();
    }
  };

  return (
    <motion.div
      className="settings-view"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        ⚙ Settings
      </h2>

      <div className="settings-card">
        <h3 className="settings-card__title">Audio</h3>
        <button 
          className={`quality-btn ${soundEnabled ? 'quality-btn--active' : ''}`}
          onClick={toggleSound}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>Background Sound</span>
          <span>{soundEnabled ? '🔊 ON' : '🔇 OFF'}</span>
        </button>
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Graphics Quality</h3>
        <div className="quality-buttons">
          {(['low', 'medium', 'high'] as const).map((q) => (
            <button
              key={q}
              className={`quality-btn ${quality === q ? 'quality-btn--active' : ''}`}
              onClick={() => setQuality(q)}
              style={{ flex: 1, textTransform: 'capitalize' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-card" style={{ marginTop: '2rem', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--color-text)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Log Out
        </button>
      </div>
    </motion.div>
  );
};

export default SettingsView;
