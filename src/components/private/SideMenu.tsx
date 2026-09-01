import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../../contexts/AuthContext';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, currentView, onNavigate }) => {
  const { signOut } = useAuthContext();

  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const menuItems = [
    { id: 'chat', label: '💬 Messages' },
    { id: 'garden', label: '🌸 Garden' },
    { id: 'games', label: '🎮 Games' },
    { id: 'memories', label: '✨ Memories' },
    { id: 'settings', label: '⚙ Settings' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="side-menu__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="side-menu"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="side-menu__items">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className={`side-menu__item ${currentView === item.id ? 'side-menu__item--active' : ''}`}
                  onClick={() => handleNavigate(item.id)}
                >
                  {item.label}
                </div>
              ))}
              
              <div style={{ marginTop: 'auto' }}>
                <button 
                  onClick={signOut}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-dim, rgba(255,255,255,0.4))',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    padding: '0.75rem 1rem',
                  }}
                >
                  Log Out
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SideMenu;
