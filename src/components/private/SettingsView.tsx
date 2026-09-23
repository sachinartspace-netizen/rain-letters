import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from '../../hooks/useSound';
import useQuality from '../../hooks/useQuality';
import { useAuthContext } from '../../contexts/AuthContext';
import { fetchDeviceVisits } from '../../lib/tracker';

const SettingsView: React.FC = () => {
  const { soundEnabled, toggleSound } = useSound();
  const { quality, setQuality } = useQuality();
  const { signOut } = useAuthContext();

  const [visits, setVisits] = useState<any[]>([]);
  const [showVisits, setShowVisits] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);

  const loadVisits = async () => {
    setLoadingVisits(true);
    setShowVisits(true);
    const data = await fetchDeviceVisits(100);
    setVisits(data);
    setLoadingVisits(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      signOut();
    }
  };

  const formatVisitDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
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

      {/* Audio Settings */}
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

      {/* Graphics Quality */}
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

      {/* Device Visitor History */}
      <div className="settings-card">
        <h3 className="settings-card__title">📱 Device Visitor Logs</h3>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem' }}>
          See all devices that visited your web app with exact model and timestamp.
        </p>
        <button
          className="quality-btn"
          onClick={loadVisits}
          style={{ width: '100%', background: 'rgba(74, 144, 217, 0.2)', borderColor: '#4a90d9' }}
        >
          {loadingVisits ? 'Loading...' : showVisits ? '🔄 Refresh Device Visits' : '🔍 View Device Visits'}
        </button>

        <AnimatePresence>
          {showVisits && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: '1rem', maxHeight: '350px', overflowY: 'auto' }}
            >
              {visits.length === 0 && !loadingVisits ? (
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '1rem' }}>
                  No visit logs recorded yet (or table setup pending).
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {visits.map((v) => (
                    <div
                      key={v.id}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '0.85rem',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#93c5fd' }}>
                        <span>📱 {v.device_model || v.device_brand || 'Unknown Device'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                          {formatVisitDate(v.created_at)}
                        </span>
                      </div>
                      <div style={{ marginTop: '4px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>
                        💻 {v.os} • {v.browser}
                      </div>
                      <div style={{ marginTop: '2px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                        {v.city && v.country ? `📍 ${v.city}, ${v.country} • ` : ''}
                        📏 {v.screen_size}
                        {v.user_email ? ` • 👤 ${v.user_email}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout */}
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
